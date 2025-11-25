import neo4j from 'neo4j-driver'; // 1. Usar import para neo4j-driver

// Substitua com suas credenciais!
const URI = 'bolt://localhost:7687'; // Protocolo Bolt é o padrão
const USER = 'neo4j';
const PASSWORD = 'neo4jteste';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

// Opcional: Testa a conexão ao iniciar o app
driver.verifyConnectivity()
    .then(() => console.log('✅ Conexão Neo4j estabelecida com sucesso!'))
    .catch(error => console.error('❌ Falha na Conexão Neo4j:', error));

// Exportação Padrão do driver (necessária para 'import driver from...')
export default driver;