import jwt from 'jsonwebtoken';

/**
 * Middleware para validar el token JWT en las solicitudes entrantes.
 * Espera la cabecera Authorization con formato 'Bearer <token>'.
 */
const authMiddleware = (req, res, next) => {
    try {
        //Comprobar si el token existe en la cabecera Authorization
        const authHeader = req.headers.authorization;

        // Validar la existencia de la cabecera y el formato Bearer
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Unauthorized'
            });
        }

        // Extraer el token, split se usa para dividir el string en un array y el 1 es para 
        // coger el segundo elemento que es el token
        const token = authHeader.split(' ')[1];

        // Verificar el token con la clave secreta
        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) {
            console.error('Error: JWT_SECRET no está configurado.');
            return res.status(500).json({
                exito: false,
                mensaje: 'Error de configuración del servidor.'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, secretKey);

        // Decodificar el token
        req.usuario = decoded;

        // Continuar con el siguiente middleware o controlador
        next();
    } catch (error) {
        console.error('Error de verificación de JWT:', error.message);
        return res.status(401).json({
            exito: false,
            mensaje: 'Unauthorized'
        });
    }
};

export default authMiddleware;
