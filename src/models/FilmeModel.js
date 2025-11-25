import neo4j from 'neo4j-driver';
import driver from '../config/neo4j.js'; 

/**
 * Cria um novo nó de Filme no Neo4j.
 * @param {Object} dados - Contém titulo e ano do filme.
 * @returns {Promise<Object>} O objeto do filme criado.
 */
const criarFilme = async (dados) => {
    const anoInteger = neo4j.int(dados.ano); 
    const session = driver.session();
    
    try {
        // CORREÇÃO: Usar session.executeWrite() em vez de session.writeTransaction()
        const result = await session.executeWrite(tx =>
            tx.run(
                // Cypher Query
                `
                CREATE (f:Filme {titulo: $titulo, ano: $ano})
                RETURN f
                `,
                // Parâmetros
                { titulo: dados.titulo, ano: anoInteger } 
            )
        );
        // ... (o resto do código de tratamento do resultado permanece o mesmo)

        if (result.records.length === 0) {
            throw new Error('Falha ao criar o filme. Resultado vazio.');
        }

        const record = result.records[0];
        const filmeNode = record.get('f');

        return {
            id: neo4j.integer.toNumber(filmeNode.identity), 
            ...filmeNode.properties
        };
    } finally {
        await session.close(); 
    }
};

export default criarFilme;