import express from 'express'; // Importa el framework Express que se usa para crear el servidor y las rutas
import cors from 'cors'; // Importa el middleware de CORS
import dotenv from 'dotenv'; // Importa las variables del entorno
import path from 'path'; // Importa el módulo path para rutas
import helmet from 'helmet'; // Importa helmet para cabeceras HTTP seguras
import rateLimit from 'express-rate-limit'; // Importa express-rate-limit para mitigación DoS/fuerza bruta
import pool from './config/db.js'; // Inicializa la conexión a la base de datos
import authRoutes from './routes/authRoutes.js'; // Importa las rutas de autenticación
import portafolioRoutes from './routes/portafolioRoutes.js'; // Importa las rutas de portafolios
import imagenRoutes from './routes/imagenRoutes.js'; // Importa las rutas de gestión de imágenes independientes

dotenv.config(); // Carga las variables del entorno .env para usarlas con process.env

const app = express();
const PORT = process.env.PORT;

// CORS configurado
const corsOptions = {
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200
};

// Limitador de tasa para endpoints de la API (omitido en entorno de pruebas)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 150, // Límite de 150 peticiones por IP
    message: {
        exito: false,
        mensaje: 'Demasiadas peticiones desde esta dirección IP. Por favor, inténtelo de nuevo en 15 minutos.'
    },
    standardHeaders: true, // Habilita los encabezados de límite de tasa HTTP estándar
    legacyHeaders: false, // Deshabilita el uso de encabezados de límite de tasa heredados
    skip: () => process.env.NODE_ENV === 'test' // Omitir el limitador de tasa en entorno de pruebas
});

// Middlewares globales
app.use(cors(corsOptions)); // Configuración CORS para permitir peticiones desde el cliente
app.use(helmet()); // Configuración de seguridad para las cabeceras HTTP
app.use(express.json()); // Habilita el análisis de JSON en el cuerpo de las peticiones

// Aplicar limitador de tasa a los endpoints de la API
app.use('/api', apiLimiter);

// Servir la carpeta de imágenes físicamente ubicada un nivel por encima del backend
// busca en blinkweb-imagenes que se encuentra en la carpeta exterior a la actual
app.use('/imagenes', express.static(path.join(process.cwd(), '../blinkweb-imagenes')));

// Registro de rutas modulares
app.use('/api/auth', authRoutes);
app.use('/api/portafolios', portafolioRoutes);
app.use('/api/imagenes', imagenRoutes);


// Ruta de comprobación técnica (Health Check)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        platform: 'blinkWeb API',
        environment: process.env.NODE_ENV,
        timestamp: new Date()
    });
});

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
    res.status(404).json({ error: 'La ruta solicitada no existe en el servidor' });
});

// Inicio del servidor HTTP
app.listen(PORT, () => {
    console.log(`🚀 Servidor de blinkWeb desplegado en: http://localhost:${PORT}`);
});