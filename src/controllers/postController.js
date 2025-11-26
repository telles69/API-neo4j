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
        const posts = await Post.findMany({});
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

        await neogma.queryRunner.run(
            `MATCH (u:User {id: $userId}), (p:Post {id: $id})
             MERGE (u)-[:LIKES]->(p)`,
            { userId, id }
        );

        return res.status(200).send({ message: 'Post curtido com sucesso' });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getFeed = async (req, res) => {
    try {
        const { userId } = req.query; // Passar userId como query param para simplificar

        if (!userId) {
            return res.status(400).send({ message: 'userId é obrigatório na query' });
        }

        const neogma = getNeogma();
        const result = await neogma.queryRunner.run(
            `MATCH (me:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:POSTED]->(post:Post)
             RETURN post.id as id, post.content as content, post.createdAt as createdAt, friend.username as author
             ORDER BY post.createdAt DESC
             LIMIT 20`,
            { userId }
        );

        const feed = result.records.map(record => ({
            id: record.get('id'),
            content: record.get('content'),
            createdAt: record.get('createdAt'),
            author: record.get('author')
        }));

        return res.status(200).send({
            message: 'Feed de notícias',
            data: feed
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text, userId } = req.body;

        if (!text || !userId) {
            return res.status(400).send({ message: 'Texto e userId são obrigatórios' });
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
            { userId, postId, id, text, now }
        );

        return res.status(201).send({
            message: 'Comentário criado',
            data: { id, text, createdAt: now }
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
    createComment
};
