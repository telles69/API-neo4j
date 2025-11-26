import { Neogma } from 'neogma';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../../.env') });

let neogma = null;

export const getNeogma = () => {
    if (!neogma) {
        neogma = new Neogma({
            url: process.env.NEO4J_URI || 'bolt://localhost:7687',
            username: process.env.NEO4J_USERNAME || 'neo4j',
            password: process.env.NEO4J_PASSWORD || 'password',
        });
    }
    return neogma;
};

export default getNeogma;

