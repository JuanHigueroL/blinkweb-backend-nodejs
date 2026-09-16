import * as authService from '../services/authService.js';

/**
 * Controlador de registro de usuarios.
 * Realiza las validaciones de entrada iniciales y delega la creación al servicio de autenticación.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP enviada al cliente con el resultado del registro.
 * Devuelve el token y el id, email, nombre_cuenta del usuario.
 */
export const registroUsuario = async (req, res) => {
    try {
        const { email, nombre_cuenta, password, confirmPassword } = req.body;

        // 1. Validaciones básicas: Presencia de todos los campos obligatorios
        if (!email || !nombre_cuenta || !password || !confirmPassword) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Todos los campos son obligatorios (email, nombre_cuenta, password, confirmPassword).'
            });
        }

        // 3. Validación obligatoria: comprobar que password y confirmPassword sean exactamente iguales
        if (password !== confirmPassword) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Las contraseñas no coinciden.'
            });
        }

        // 4. Validación de formato de email (evita guardar registros malformados)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El formato del correo electrónico no es válido.'
            });
        }

        // 5. Delegar la creación e inscripción del usuario en la base de datos al servicio
        const respuesta = await authService.registrarUsuario({
            email,
            nombre_cuenta,
            password
        });

        // 6. Si el servicio retornó un error, responder con el código correspondiente
        if (!respuesta.exito) {
            return res.status(respuesta.codigo).json({
                exito: false,
                mensaje: respuesta.mensaje
            });
        }

        // 7. Retornar éxito utilizando el código de estado estándar 201 Created
        return res.status(respuesta.codigo).json({
            exito: true,
            mensaje: 'Usuario registrado correctamente.',
            resultado: respuesta.resultado
        });

    } catch (error) {
        console.error('Error en registroUsuario (Controller):', error);
        return res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al procesar el registro.'
        });
    }
};

/**
 * Controlador de login de usuarios.
 * Realiza las validaciones de entrada iniciales y delega la validación y generación de JWT al servicio.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP enviada al cliente con el token y datos del usuario.
 * Devuelve el token y el id, email, nombre_cuenta del usuario.
 */
export const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validaciones básicas de presencia de credenciales
        if (!email || !password) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El email y la contraseña son obligatorios.'
            });
        }

        // 2. Delegar la autenticación y obtención de JWT al servicio de negocio
        const respuesta = await authService.loginUsuario({ email, password });

        // 3. Responder según el estado devuelto por el servicio (ej. 401 si no coincide la clave, 403 si está inactivo)
        if (!respuesta.exito) {
            return res.status(respuesta.codigo).json({
                exito: false,
                mensaje: respuesta.mensaje
            });
        }

        // 4. Retornar respuesta exitosa (200 OK) con token y datos públicos del usuario
        return res.status(respuesta.codigo).json({
            exito: true,
            mensaje: 'Inicio de sesión exitoso.',
            resultado: respuesta.resultado
        });

    } catch (error) {
        console.error('Error en loginUsuario (Controller):', error);
        return res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor al procesar el inicio de sesión.'
        });
    }
};

/**
 * Controlador para la verificación de tokens de sesión.
 * Solo debe devolver 200 OK con el usuario inyectado por el middleware.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Object} La respuesta HTTP con los datos del usuario verificado.
 */
export const verificarToken = (req, res) => {
    return res.status(200).json({
        exito: true,
        mensaje: 'Token válido',
        usuario: req.usuario
    });
};
