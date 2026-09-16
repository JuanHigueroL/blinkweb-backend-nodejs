import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Obtiene la ruta absoluta del directorio donde se está ejecutando el script actual (server.js)
const __dirname = path.resolve();

// Define la ruta absoluta de la carpeta de imágenes: un nivel por encima del backend
const uploadDir = path.join(__dirname, '../blinkweb-imagenes');

// Verificar si el directorio existe y si no se crea
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configuración de almacenamiento físico para Multer.
 * Define la carpeta de destino y genera un nombre de archivo único para evitar colisiones.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + '-' + crypto.randomUUID() + ext);
    }
});

/**
 * Filtro estricto para evitar la carga de archivos maliciosos (solo imágenes).
 */
const fileFilter = (req, file, cb) => {
    const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimetypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes en formato JPEG, PNG o WEBP.'), false);
    }
};

/**
 * Middleware de Multer configurado para la carga de imágenes del portafolio.
 */
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB por archivo
    },
    fileFilter
});

export default upload;
