import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { crearUsuario, obtenerUsuarioPorEmail } from '../daos/usuarioDao.js';

/**
 * Registra un nuevo usuario en el sistema.
 * 
 * @param {Object} datos - Datos del usuario a registrar
 * @param {string} datos.email - Correo electrónico
 * @param {string} datos.nombre_cuenta - Nombre de la cuenta
 * @param {string} datos.password - Contraseña en texto plano
 * @returns {Promise<Object>} Resultado de la operación con estado de éxito, código HTTP y datos/mensaje.
 */
export const registrarUsuario = async ({ email, nombre_cuenta, password }) => {
    // 1. Comprobar si el email ya existe en la base de datos
    const usuarioExistente = await obtenerUsuarioPorEmail(email);
    if (usuarioExistente) {
        return {
            exito: false,
            codigo: 409, // Conflict
            mensaje: 'El correo electrónico ya se encuentra registrado.'
        };
    }

    // 2. Encriptar contraseña usando bcrypt con 10 salt rounds
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Guardar el nuevo usuario a través de la capa DAO
    const id_usuario = await crearUsuario({
        email,
        password_hash,
        nombre_cuenta
    });

    // 4. Firmar y generar el JWT con la clave secreta
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error('JWT_SECRET no está definido en las variables de entorno.');
    }

    // EN un futuro meter el token en Cookies httpOnly secure
    const token = jwt.sign(
        {
            id_usuario: id_usuario,
            email: email,
            nombre_cuenta: nombre_cuenta
        },
        secretKey,
        { expiresIn: '30d' }
    );

    // 5. Excluir campos innecesarios y sensibles en la respuesta del objeto del usuario
    const usuario = { id_usuario, nombre_cuenta, email };

    return {
        exito: true,
        codigo: 201, // OK
        resultado: {
            token,
            usuario: usuario
        }
    };
};

/**
 * Autentica un usuario y genera un token JWT.
 * 
 * @param {Object} credenciales - Credenciales de acceso
 * @param {string} credenciales.email - Correo electrónico
 * @param {string} credenciales.password - Contraseña en texto plano
 * @returns {Promise<Object>} Resultado de la operación con estado de éxito, código HTTP, token y datos/mensaje.
 */
export const loginUsuario = async ({ email, password }) => {
    // 1. Buscar al usuario en la base de datos por email
    const usuario = await obtenerUsuarioPorEmail(email);

    // Si no existe, devolver error genérico 401 por razones de seguridad
    if (!usuario) {
        return {
            exito: false,
            codigo: 401, // Unauthorized
            mensaje: 'Credenciales inválidas.'
        };
    }

    // 2. Validar que la cuenta del usuario esté activa
    if (!usuario.activo) {
        return {
            exito: false,
            codigo: 403, // Forbidden
            mensaje: 'Esta cuenta se encuentra inactiva.'
        };
    }

    // 3. Comparar la contraseña provista con la almacenada (password_hash)
    const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordCorrecta) {
        return {
            exito: false,
            codigo: 401, // Unauthorized
            mensaje: 'Credenciales inválidas.'
        };
    }

    // 4. Firmar y generar el JWT con la clave secreta
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error('JWT_SECRET no está definido en las variables de entorno.');
    }

    //EN un futuro meter el token en Cookies httpOnly secure
    const token = jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            email: usuario.email,
            nombre_cuenta: usuario.nombre_cuenta
        },
        secretKey,
        { expiresIn: '30d' }
    );

    // 5. Excluir campos innecesarios y sensibles en la respuesta del objeto del usuario
    const { password_hash, fecha_creacion, fecha_actualizacion, activo, ...datosUsuario } = usuario;

    return {
        exito: true,
        codigo: 200, // OK
        resultado: {
            token,
            usuario: datosUsuario
        }
    };
};
