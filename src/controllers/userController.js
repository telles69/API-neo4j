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
        const user = await User.findOne({ where: { id } });
        
        if (!user) {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }

        return res.status(200).send({
            message: 'Perfil encontrado',
            data: user
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
        const { id } = req.params; // ID do usuário logado (simulado)
        
        const neogma = getNeogma();
        const result = await neogma.queryRunner.run(
            `MATCH (me:User {id: $id})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(recommended:User)
             WHERE NOT (me)-[:FOLLOWS]->(recommended) AND me <> recommended
             RETURN recommended.username AS recommendedUser, recommended.id as recommendedId, count(friend) AS commonFriends
             ORDER BY commonFriends DESC
             LIMIT 5`,
            { id }
        );

        const recommendations = result.records.map(record => ({
            username: record.get('recommendedUser'),
            id: record.get('recommendedId'),
            commonFriends: record.get('commonFriends').toNumber()
        }));

        return res.status(200).send({
            message: 'Recomendações de amizade',
            data: recommendations
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
    getRecommendations
};
