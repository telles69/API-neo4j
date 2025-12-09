import User from "../models/UserModel.js";
import { randomUUID } from 'node:crypto';
import getNeogma from "../config/neogma.js";

const create = async (req, res) => {
    try {
        const { username, email, password, bio } = req.body;
        
        // Validação básica
        if (!username || !email || !password) {
            return res.status(400).send({ message: 'Campos obrigatórios faltando' });
        }

        const id = randomUUID();
        const now = new Date().toISOString();

        const user = await User.createOne({
            id,
            username,
            email,
            password, // Em produção, use hash (bcrypt)
            bio: bio || '',
            createdAt: now,
            updatedAt: now
        });

        return res.status(201).send({
            message: 'Usuário criado com sucesso',
            data: { id, username, email, bio }
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const neogma = getNeogma();
        
        // Busca usuário com contagem de seguidores e seguindo
        const result = await neogma.queryRunner.run(
            `MATCH (u:User {id: $id})
             OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
             OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
             RETURN u.id AS id, u.username AS username, u.email AS email, 
                    u.password AS password, u.bio AS bio,
                    count(DISTINCT follower) AS followers,
                    count(DISTINCT following) AS following`,
            { id }
        );

        if (result.records.length === 0) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }

        const record = result.records[0];
        const userData = {
            id: record.get('id'),
            username: record.get('username'),
            email: record.get('email'),
            password: record.get('password'),
            bio: record.get('bio'),
            followers: record.get('followers')?.toNumber?.() ?? record.get('followers'),
            following: record.get('following')?.toNumber?.() ?? record.get('following')
        };

        return res.status(200).send({
            message: 'Perfil encontrado',
            data: userData
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const users = await User.findMany({});
        return res.status(200).send({
            message: 'Lista de usuários',
            data: users
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const followUser = async (req, res) => {
    try {
        const { id } = req.params; // ID do usuário a ser seguido
        const { followerId } = req.body; // ID do usuário que está seguindo (simulado, viria do token)

        if (!followerId) {
            return res.status(400).send({ message: 'followerId é obrigatório no body' });
        }

        const neogma = getNeogma();
        
        // Verifica se ambos existem
        const userToFollow = await User.findOne({ where: { id } });
        const follower = await User.findOne({ where: { id: followerId } });

        if (!userToFollow || !follower) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }

        // Cria relacionamento
        await neogma.queryRunner.run(
            `MATCH (a:User {id: $followerId}), (b:User {id: $id})
             MERGE (a)-[:FOLLOWS]->(b)`,
            { followerId, id }
        );

        return res.status(200).send({ message: 'Seguindo com sucesso' });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const unfollowUser = async (req, res) => {
    try {
        const { id } = req.params; // ID do usuário a deixar de seguir
        const { followerId } = req.body; // ID do usuário que está deixando de seguir

        if (!followerId) {
            return res.status(400).send({ message: 'followerId é obrigatório no body' });
        }

        const neogma = getNeogma();

        // Deleta relacionamento
        await neogma.queryRunner.run(
            `MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $id})
             DELETE r`,
            { followerId, id }
        );

        return res.status(200).send({ message: 'Deixou de seguir com sucesso' });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getRecommendations = async (req, res) => {
    try {
        const { id } = req.params; // ID do usuário logado
        
        const neogma = getNeogma();
        
        // Estratégia 1: Amigos de amigos (maior peso)
        // Usuários que seus amigos seguem mas você não segue
        const friendsOfFriendsResult = await neogma.queryRunner.run(
            `MATCH (me:User {id: $id})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(recommended:User)
             WHERE NOT (me)-[:FOLLOWS]->(recommended) AND me <> recommended
             WITH recommended, count(DISTINCT friend) AS commonFriends
             OPTIONAL MATCH (recommended)<-[:FOLLOWS]-(follower:User)
             OPTIONAL MATCH (recommended)-[:POSTED]->(post:Post)
             RETURN recommended.id AS userId, 
                    recommended.username AS username, 
                    recommended.email AS email,
                    recommended.bio AS bio,
                    commonFriends,
                    count(DISTINCT follower) AS totalFollowers,
                    count(DISTINCT post) AS totalPosts
             ORDER BY commonFriends DESC, totalFollowers DESC
             LIMIT 10`,
            { id }
        );

        const friendsOfFriends = friendsOfFriendsResult.records.map(record => ({
            userId: record.get('userId'),
            username: record.get('username'),
            email: record.get('email'),
            bio: record.get('bio'),
            reason: 'friends_of_friends',
            score: (record.get('commonFriends')?.toNumber?.() ?? record.get('commonFriends')) * 10 +
                   (record.get('totalFollowers')?.toNumber?.() ?? record.get('totalFollowers')) * 0.5,
            commonFriends: record.get('commonFriends')?.toNumber?.() ?? record.get('commonFriends'),
            totalFollowers: record.get('totalFollowers')?.toNumber?.() ?? record.get('totalFollowers'),
            totalPosts: record.get('totalPosts')?.toNumber?.() ?? record.get('totalPosts')
        }));

        // Estratégia 2: Usuários populares que você não segue
        const popularUsersResult = await neogma.queryRunner.run(
            `MATCH (me:User {id: $id})
             MATCH (popular:User)
             WHERE NOT (me)-[:FOLLOWS]->(popular) AND me <> popular
             OPTIONAL MATCH (popular)<-[:FOLLOWS]-(follower:User)
             OPTIONAL MATCH (popular)-[:POSTED]->(post:Post)
             WITH popular, count(DISTINCT follower) AS totalFollowers, count(DISTINCT post) AS totalPosts
             WHERE totalFollowers > 0 OR totalPosts > 0
             RETURN popular.id AS userId,
                    popular.username AS username,
                    popular.email AS email,
                    popular.bio AS bio,
                    totalFollowers,
                    totalPosts
             ORDER BY totalFollowers DESC, totalPosts DESC
             LIMIT 5`,
            { id }
        );

        const popularUsers = popularUsersResult.records.map(record => ({
            userId: record.get('userId'),
            username: record.get('username'),
            email: record.get('email'),
            bio: record.get('bio'),
            reason: 'popular',
            score: (record.get('totalFollowers')?.toNumber?.() ?? record.get('totalFollowers')) * 2 +
                   (record.get('totalPosts')?.toNumber?.() ?? record.get('totalPosts')) * 0.3,
            commonFriends: 0,
            totalFollowers: record.get('totalFollowers')?.toNumber?.() ?? record.get('totalFollowers'),
            totalPosts: record.get('totalPosts')?.toNumber?.() ?? record.get('totalPosts')
        }));

        // Estratégia 3: Usuários ativos (postam muito) que você não segue
        const activeUsersResult = await neogma.queryRunner.run(
            `MATCH (me:User {id: $id})
             MATCH (active:User)-[:POSTED]->(post:Post)
             WHERE NOT (me)-[:FOLLOWS]->(active) AND me <> active
             WITH active, count(post) AS totalPosts
             WHERE totalPosts >= 2
             OPTIONAL MATCH (active)<-[:FOLLOWS]-(follower:User)
             RETURN active.id AS userId,
                    active.username AS username,
                    active.email AS email,
                    active.bio AS bio,
                    totalPosts,
                    count(DISTINCT follower) AS totalFollowers
             ORDER BY totalPosts DESC
             LIMIT 5`,
            { id }
        );

        const activeUsers = activeUsersResult.records.map(record => ({
            userId: record.get('userId'),
            username: record.get('username'),
            email: record.get('email'),
            bio: record.get('bio'),
            reason: 'active',
            score: (record.get('totalPosts')?.toNumber?.() ?? record.get('totalPosts')) * 3 +
                   (record.get('totalFollowers')?.toNumber?.() ?? record.get('totalFollowers')) * 0.5,
            commonFriends: 0,
            totalFollowers: record.get('totalFollowers')?.toNumber?.() ?? record.get('totalFollowers'),
            totalPosts: record.get('totalPosts')?.toNumber?.() ?? record.get('totalPosts')
        }));

        // Combina todas as recomendações e remove duplicatas
        const allRecommendations = [...friendsOfFriends, ...popularUsers, ...activeUsers];
        const uniqueRecommendations = [];
        const seenIds = new Set();

        for (const rec of allRecommendations) {
            if (!seenIds.has(rec.userId)) {
                seenIds.add(rec.userId);
                uniqueRecommendations.push(rec);
            }
        }

        // Ordena por score (amigos em comum têm prioridade)
        uniqueRecommendations.sort((a, b) => b.score - a.score);

        // Retorna top 10
        const topRecommendations = uniqueRecommendations.slice(0, 10);

        return res.status(200).send({
            message: 'Recomendações personalizadas',
            data: topRecommendations
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

// Posts de um usuário específico com contagens de likes e comentários
const getUserPosts = async (req, res) => {
    try {
        const { id } = req.params;
        const neogma = getNeogma();
        const result = await neogma.queryRunner.run(
            `MATCH (u:User {id: $id})-[:POSTED]->(p:Post)
             OPTIONAL MATCH (p)<-[:LIKES]-(lu:User)
             OPTIONAL MATCH (p)<-[:ON]-(cm:Comment)
             RETURN p.id AS id, p.content AS content, p.createdAt AS createdAt, u.username AS author,
                    count(DISTINCT lu) AS likes, count(DISTINCT cm) AS comments
             ORDER BY createdAt DESC`,
            { id }
        );

        const posts = result.records.map(r => ({
            id: r.get('id'),
            content: r.get('content'),
            createdAt: r.get('createdAt'),
            author: r.get('author'),
            likes: r.get('likes')?.toNumber?.() ?? r.get('likes'),
            comments: r.get('comments')?.toNumber?.() ?? r.get('comments'),
        }));

        return res.status(200).send({ message: 'Posts do usuário', data: posts });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const neogma = getNeogma();
        
        const result = await neogma.queryRunner.run(
            `MATCH (u:User {id: $id})<-[:FOLLOWS]-(follower:User)
             RETURN follower.id AS id, follower.username AS username, 
                    follower.email AS email, follower.bio AS bio
             ORDER BY follower.username`,
            { id }
        );

        const followers = result.records.map(r => ({
            id: r.get('id'),
            username: r.get('username'),
            email: r.get('email'),
            bio: r.get('bio')
        }));

        return res.status(200).send({ 
            message: 'Seguidores do usuário', 
            data: followers 
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        const neogma = getNeogma();
        
        const result = await neogma.queryRunner.run(
            `MATCH (u:User {id: $id})-[:FOLLOWS]->(following:User)
             RETURN following.id AS id, following.username AS username, 
                    following.email AS email, following.bio AS bio
             ORDER BY following.username`,
            { id }
        );

        const followingList = result.records.map(r => ({
            id: r.get('id'),
            username: r.get('username'),
            email: r.get('email'),
            bio: r.get('bio')
        }));

        return res.status(200).send({ 
            message: 'Usuários seguidos', 
            data: followingList 
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { q, userId } = req.query; // q = query de busca, userId = usuário logado
        
        if (!q || q.trim().length === 0) {
            return res.status(400).send({ message: 'Query de busca é obrigatória' });
        }

        const neogma = getNeogma();
        const searchTerm = q.toLowerCase();
        
        // Busca usuários por username ou email (case-insensitive)
        const result = await neogma.queryRunner.run(
            `MATCH (u:User)
             WHERE toLower(u.username) CONTAINS $searchTerm 
                OR toLower(u.email) CONTAINS $searchTerm
             ${userId ? 'OPTIONAL MATCH (currentUser:User {id: $userId})-[:FOLLOWS]->(u)' : ''}
             OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
             OPTIONAL MATCH (u)-[:POSTED]->(post:Post)
             RETURN u.id AS id, 
                    u.username AS username, 
                    u.email AS email, 
                    u.bio AS bio,
                    count(DISTINCT follower) AS followers,
                    count(DISTINCT post) AS posts
                    ${userId ? ', exists((currentUser)-[:FOLLOWS]->(u)) AS isFollowing' : ''}
             ORDER BY followers DESC, username ASC
             LIMIT 20`,
            userId ? { searchTerm, userId } : { searchTerm }
        );

        const users = result.records.map(record => ({
            id: record.get('id'),
            username: record.get('username'),
            email: record.get('email'),
            bio: record.get('bio'),
            followers: record.get('followers')?.toNumber?.() ?? record.get('followers'),
            posts: record.get('posts')?.toNumber?.() ?? record.get('posts'),
            isFollowing: userId ? record.get('isFollowing') : false
        }));

        return res.status(200).send({
            message: 'Resultados da busca',
            data: users,
            count: users.length
        });
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

export default {
    create,
    getProfile,
    getAll,
    followUser,
    unfollowUser,
    getRecommendations,
    getUserPosts,
    getFollowers,
    getFollowing,
    searchUsers
};
