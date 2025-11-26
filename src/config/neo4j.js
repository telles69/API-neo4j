import neo4j from 'neo4j-driver';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../../.env') });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const username = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

console.log('Conectando ao Neo4j:', uri);

const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password),
    {
        connectionTimeout: 5000,
        encrypted: false
    }
);

export { driver };
export default driver;





