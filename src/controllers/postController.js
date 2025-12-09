import Post from "../models/PostModel.js";
import User from "../models/UserModel.js";
import { randomUUID } from 'node:crypto';
import getNeogma from "../config/neogma.js";

const createPost = async (req, res) => {
    try {
        const { content, userId } = req.body;

        if (!content || !userId) {
            return res.status(400).send({ message: 'Conteúdo e userId são obrigatórios' });
        }

        const id = randomUUID();
        const now = new Date().toISOString();

        // Verifica se usuário existe
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }

        // Cria o post sem o relacionamento automático para evitar erro de resolução de modelo
        await Post.createOne({
            id,
            content,
            createdAt: now,
            updatedAt: now
        });

        // Cria o relacionamento manualmente via Cypher
        const neogma = getNeogma();
        await neogma.queryRunner.run(
            `MATCH (u:User {id: $userId}), (p:Post {id: $id})
             MERGE (u)-[:POSTED]->(p)`,
            { userId, id }
        );

        return res.status(201).send({
            message: 'Post criado com sucesso',
            data: { id, content, createdAt: now }
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findOne({ where: { id } });

        if (!post) {
            return res.status(404).send({ message: 'Post não encontrado' });
        }

        return res.status(200).send({
            message: 'Post encontrado',
            data: post
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const { userId } = req.query; // ID do usuário logado (opcional)
        const neogma = getNeogma();
        
        // Busca posts com informações do autor via relacionamento POSTED
        const result = await neogma.queryRunner.run(
            `MATCH (u:User)-[:POSTED]->(p:Post)
             OPTIONAL MATCH (p)<-[:LIKES]-(lu:User)
             OPTIONAL MATCH (p)<-[:ON]-(c:Comment)
             ${userId ? 'OPTIONAL MATCH (currentUser:User {id: $userId})-[follows:FOLLOWS]->(u)' : ''}
             RETURN p.id AS id, p.content AS content, p.createdAt AS createdAt, p.updatedAt AS updatedAt,
                    u.id AS userId, u.username AS username, u.email AS email,
                    count(DISTINCT lu) AS likes, count(DISTINCT c) AS comments
                    ${userId ? ', exists((currentUser)-[:FOLLOWS]->(u)) AS isFollowing' : ''}
             ORDER BY p.createdAt DESC`,
            userId ? { userId } : {}
        );

        const posts = result.records.map(record => ({
            id: record.get('id'),
            content: record.get('content'),
            createdAt: record.get('createdAt'),
            updatedAt: record.get('updatedAt'),
            userId: record.get('userId'),
            author: {
                id: record.get('userId'),
                username: record.get('username'),
                email: record.get('email')
            },
            likes: record.get('likes')?.toNumber?.() ?? record.get('likes'),
            comments: record.get('comments')?.toNumber?.() ?? record.get('comments'),
            isFollowing: userId ? record.get('isFollowing') : false
        }));

        return res.status(200).send({
            message: 'Lista de posts',
            data: posts
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const likePost = async (req, res) => {
    try {
        const { id } = req.params; // Post ID
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).send({ message: 'userId é obrigatório' });
        }

        const neogma = getNeogma();
        
        // Verifica existência
        const post = await Post.findOne({ where: { id } });
        const user = await User.findOne({ where: { id: userId } });

        if (!post || !user) {
            return res.status(404).send({ message: 'Post ou Usuário não encontrado' });
        }

        // Verifica se já existe o relacionamento LIKES
        const checkResult = await neogma.queryRunner.run(
            `MATCH (u:User {id: $userId})-[r:LIKES]->(p:Post {id: $id})
             RETURN r`,
            { userId, id }
        );

        if (checkResult.records.length > 0) {
            // Se já curtiu, remove o like
            await neogma.queryRunner.run(
                `MATCH (u:User {id: $userId})-[r:LIKES]->(p:Post {id: $id})
                 DELETE r`,
                { userId, id }
            );
            return res.status(200).send({ message: 'Like removido com sucesso', liked: false });
        } else {
            // Se não curtiu, adiciona o like
            await neogma.queryRunner.run(
                `MATCH (u:User {id: $userId}), (p:Post {id: $id})
                 MERGE (u)-[:LIKES]->(p)`,
                { userId, id }
            );
            return res.status(200).send({ message: 'Post curtido com sucesso', liked: true });
        }
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getFeed = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).send({ message: 'userId é obrigatório na query' });
        }

        const neogma = getNeogma();

        // Posts do próprio usuário + dos que ele segue
                 const postsResult = await neogma.queryRunner.run(
                     `CALL {
                     WITH $userId AS uid
                     MATCH (me:User {id: uid})-[:POSTED]->(p:Post)
                     OPTIONAL MATCH (p)<-[:LIKES]-(lu:User)
                     OPTIONAL MATCH (p)<-[:ON]-(cm:Comment)
                     RETURN p.id AS id, p.content AS content, p.createdAt AS createdAt, me.username AS author,
                         count(DISTINCT lu) AS likes, count(DISTINCT cm) AS comments
                     UNION
                     WITH $userId AS uid
                     MATCH (me:User {id: uid})-[:FOLLOWS]->(friend:User)-[:POSTED]->(fp:Post)
                     OPTIONAL MATCH (fp)<-[:LIKES]-(lu2:User)
                     OPTIONAL MATCH (fp)<-[:ON]-(cm2:Comment)
                     RETURN fp.id AS id, fp.content AS content, fp.createdAt AS createdAt, friend.username AS author,
                         count(DISTINCT lu2) AS likes, count(DISTINCT cm2) AS comments
                      }
                      RETURN id, content, createdAt, author, likes, comments
                      ORDER BY createdAt DESC
                      LIMIT 50`,
                     { userId }
                 );

        const feed = postsResult.records.map(record => ({
            id: record.get('id'),
            content: record.get('content'),
            createdAt: record.get('createdAt'),
            author: record.get('author'),
            likes: record.get('likes')?.toNumber?.() ?? record.get('likes'),
            comments: record.get('comments')?.toNumber?.() ?? record.get('comments')
        }));

        // Sugestões de pessoas para seguir: usuários que não são o próprio e que o usuário ainda não segue
        const suggestionsResult = await neogma.queryRunner.run(
            `MATCH (u:User)
             WHERE u.id <> $userId
             AND NOT EXISTS { MATCH (:User {id: $userId})-[:FOLLOWS]->(u) }
             RETURN u.id AS id, u.username AS username
             LIMIT 10`,
            { userId }
        );

        const suggestions = suggestionsResult.records.map(r => ({
            id: r.get('id'),
            username: r.get('username')
        }));

        return res.status(200).send({
            message: 'Feed de notícias',
            data: feed,
            suggestions
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const createComment = async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { text, content, userId } = req.body;

        const commentText = (typeof text === 'string' && text.trim())
            ? text.trim()
            : (typeof content === 'string' && content.trim())
            ? content.trim()
            : '';

        if (!commentText || !userId) {
            return res.status(400).send({ message: 'Texto (text/content) e userId são obrigatórios' });
        }

        const neogma = getNeogma();
        const id = randomUUID();
        const now = new Date().toISOString();

        // Cria o comentário e os relacionamentos manualmente via Cypher para garantir a estrutura correta
        // (User)-[:WROTE]->(Comment)-[:ON]->(Post)
        await neogma.queryRunner.run(
            `MATCH (u:User {id: $userId}), (p:Post {id: $postId})
             CREATE (c:Comment {id: $id, text: $text, createdAt: $now})
             CREATE (u)-[:WROTE]->(c)
             CREATE (c)-[:ON]->(p)
             RETURN c`,
            { userId, postId, id, text: commentText, now }
        );

        return res.status(201).send({
            message: 'Comentário criado',
            data: { id, content: commentText, createdAt: now }
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getComments = async (req, res) => {
    try {
        const { id: postId } = req.params;

        const neogma = getNeogma();
        const result = await neogma.queryRunner.run(
            `MATCH (p:Post {id: $postId})
             MATCH (c:Comment)-[:ON]->(p)
             OPTIONAL MATCH (u:User)-[:WROTE]->(c)
             RETURN c.id AS id, c.text AS content, c.createdAt AS createdAt, u.username AS author
             ORDER BY createdAt ASC`,
            { postId }
        );

        const comments = result.records.map(r => ({
            id: r.get('id'),
            content: r.get('content'),
            createdAt: r.get('createdAt'),
            author: r.get('author') || 'Anônimo'
        }));

        return res.status(200).send({
            message: 'Comentários do post',
            data: comments
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

export default {
    createPost,
    getPost,
    getAll,
    likePost,
    getFeed,
    createComment,
    getComments
};
