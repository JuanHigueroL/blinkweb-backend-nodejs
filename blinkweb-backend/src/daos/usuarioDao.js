import pool from '../config/db.js';

/**
 * Inserta un nuevo usuario en la base de datos.
 * Excluye los campos autogestionados por MySQL: id_usuario, activo, fecha_creacion y fecha_actualizacion.
 * 
 * @param {Object} usuario - Datos del usuario a registrar
 * @param {string} usuario.email - Correo electrónico único del usuario
 * @param {string} usuario.password_hash - Contraseña ya encriptada
 * @param {string} usuario.nombre_cuenta - Nombre de la cuenta/usuario
 * @returns {Promise<number>} ID del usuario creado (id_usuario)
 */
export const crearUsuario = async ({ email, password_hash, nombre_cuenta }) => {
    const query = `
        INSERT INTO usuarios (email, password_hash, nombre_cuenta)
        VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [email, password_hash, nombre_cuenta]);
    return result.insertId;
};

/**
 * Busca un usuario por su dirección de correo electrónico.
 * 
 * @param {string} email - Correo electrónico a buscar
 * @returns {Promise<Object|null>} El objeto del usuario si existe, o null en caso contrario
 */
export const obtenerUsuarioPorEmail = async (email) => {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows[0] || null;
};
