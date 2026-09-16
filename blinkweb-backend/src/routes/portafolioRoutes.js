import express from 'express';
import {
    crearPortafolio,
    obtenerPortafoliosPorUsuario,
    generarContenidoPortafolio,
    publicarPortafolio,
    ocultarPortafolio,
    obtenerPortafolio,
    obtenerPortafolioPublico,
    borrarPortafolio,
    editarTextos,
    subirImagenes
} from '../controllers/portafolioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Endpoint para obtener los portafolios de un usuario (id_portafolio, nombre_profesional, profesion, slug y activa)
router.get('/', authMiddleware, obtenerPortafoliosPorUsuario);

// Endpoint público para obtener un portafolio completo por su slug (sin requerir autenticación)
router.get('/publico/:slug', obtenerPortafolioPublico);

// Endpoint para obtener un portafolio completo por su ID (incluyendo todas sus imágenes estructuradas)
router.get('/:id', authMiddleware, obtenerPortafolio);

// Endpoint para eliminar un portafolio completo (incluyendo archivos físicos)
router.delete('/:id', authMiddleware, borrarPortafolio);

// Endpoint para crear un portafolio (devuelve el id del portafolio creado)
router.post('/', authMiddleware, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'portada', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), crearPortafolio);

// Endpoint para generar el contenido SEO e IA de un portafolio (no devuelve nada)
router.post('/:id/generar-ia', authMiddleware, generarContenidoPortafolio);

// Endpoints de publicación y gestión de slugs
router.post('/:id/publicar', authMiddleware, publicarPortafolio);

// Endpoint para desactivar un portafolio
router.post('/:id/desactivar', authMiddleware, ocultarPortafolio);

// --- NUEVOS ENDPOINTS DE EDICIÓN MANUAL ---

// Endpoint para la edición parcial de textos y redes sociales
router.patch('/:id', authMiddleware, editarTextos);

// Endpoint para añadir nuevas imágenes (logo, portada o galería) de forma independiente
router.post('/:id/imagenes', authMiddleware, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'portada', maxCount: 1 },
    { name: 'galeria', maxCount: 10 }
]), subirImagenes);

export default router;

