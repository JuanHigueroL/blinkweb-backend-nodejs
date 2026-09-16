import express from 'express';
import { eliminarImagen } from '../controllers/imagenController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Endpoint para eliminar una imagen específica
router.delete('/:id_imagen', authMiddleware, eliminarImagen);

export default router;
