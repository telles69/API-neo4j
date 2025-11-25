import criarFilme from '../models/FilmeModel.js'; // Importa a exportação default

/**
 * Lida com a requisição POST /api/filmes para criar um novo filme.
 */
export const criar = async (req, res) => {
    const { titulo, ano } = req.body;

    if (!titulo || !ano || isNaN(parseInt(ano))) {
        return res.status(400).json({ error: 'Título e ano (número válido) são obrigatórios.' });
    }

    try {
        const novoFilme = await criarFilme({ titulo, ano: parseInt(ano) });
        
        res.status(201).json({ 
            message: 'Filme criado com sucesso!', 
            data: novoFilme 
        });
    } catch (error) {
        console.error('Erro ao criar filme no Neo4j:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
// Usamos 'export const' ou 'export function' para named exports
// Poderíamos usar 'export default' aqui se quiséssemos exportar apenas uma coisa.