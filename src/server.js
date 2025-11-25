import express from 'express';
import bodyParser from 'body-parser';
import filmeRoutes from './routes/filmeRoute.js'; // Importa a exportação default do router
import driver from './config/neo4j.js'; // Importa (e executa o código de conexão)

const app = express();
const PORT = 3000;

// Middleware para analisar corpos JSON
app.use(bodyParser.json());

// Monta o roteador no caminho base /api/filmes
app.use('/api/filmes', filmeRoutes);

app.get('/', (req, res) => {
    res.send('API Neo4j em execução.');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Fechamento seguro do driver (opcional, mas recomendado para clean shutdown)
process.on('SIGINT', async () => {
    console.log('Fechando driver Neo4j...');
    await driver.close();
    process.exit(0);
});