import express from 'express';
import { registroUsuario, loginUsuario, verificarToken } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Endpoint para el registro de usuarios
 * POST /api/auth/register
 */
router.post('/register', registroUsuario);

/**
 * Endpoint para el inicio de sesión (Login)
 * POST /api/auth/login
 */
router.post('/login', loginUsuario);

/**
 * Endpoint para la verificación del token de sesión
 * GET /api/auth/verify
 */
router.get('/verify', authMiddleware, verificarToken);

export default router;
