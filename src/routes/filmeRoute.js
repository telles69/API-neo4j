import express from 'express';
import { criar } from '../controllers/filmeController.js'; // Importa a named export

const router = express.Router();

// Rota: POST /api/filmes
router.post('/', criar);

export default router; // Exportação padrão do router