import crypto from 'crypto';
import pool from '../config/db.js';

/**
 * Inserta un nuevo portafolio en la base de datos.
 * @param {Object} datos - Datos del portafolio
 * @param {number} datos.id_usuario - ID del usuario propietario
 * @param {string} datos.nombre_profesional - Nombre del profesional
 * @param {string} datos.profesion - Profesión del profesional
 * @param {string} [datos.tipo_perfil='particular'] - Tipo de perfil
 * @param {string} [datos.zona_servicio] - Zona de servicio
 * @param {string} [datos.descripcion_personal] - Descripción personal corta
 * @param {string} [datos.descripcion_detallada] - Descripción detallada
 * @param {string} [datos.especialidades] - Especialidades
 * @param {string} [datos.tono_pagina='formal'] - Tono de la página
 * @param {string} [datos.preferencia_estilo_usuario] - Descripción en texto del estilo preferido por el usuario
 * @param {string} [datos.telefono] - Teléfono de contacto
 * @param {string} [datos.email_contacto] - Email de contacto
 * @param {string} [datos.ubicacion] - Ubicación física
 * @param {string} [datos.horarios] - Horarios de atención
 * @param {string} [datos.whatsapp] - WhatsApp
 * @param {string} [datos.instagram] - Instagram
 * @param {string} [datos.facebook] - Facebook
 * @param {string} [datos.linkedin] - LinkedIn
 * @param {string} [datos.twitter] - Twitter
 * @param {string} [datos.tiktok] - TikTok
 * @param {string} [datos.youtube] - YouTube
 * @param {string} [datos.carrusel_titulo='Galería'] - Título de la galería
 * @returns {Promise<string>} ID del portafolio creado (UUID)
 */
export const insertarPortafolio = async (datos) => {
    const id_portafolio = crypto.randomUUID();

    const {
        id_usuario,
        nombre_profesional,
        profesion,
        tipo_perfil = 'particular',
        zona_servicio = null,
        descripcion_personal = null,
        descripcion_detallada = null,
        especialidades = null,
        tono_pagina = 'formal',
        preferencia_estilo_usuario = null,
        telefono = null,
        email_contacto = null,
        ubicacion = null,
        horarios = null,
        whatsapp = null,
        instagram = null,
        facebook = null,
        linkedin = null,
        twitter = null,
        tiktok = null,
        youtube = null,
        carrusel_titulo = 'Galería'
    } = datos;

    const query = `
        INSERT INTO portafolios (
            id_portafolio,
            id_usuario,
            nombre_profesional,
            profesion,
            tipo_perfil,
            zona_servicio,
            descripcion_personal,
            descripcion_detallada,
            especialidades,
            tono_pagina,
            preferencia_estilo_usuario,
            telefono,
            email_contacto,
            ubicacion,
            horarios,
            whatsapp,
            instagram,
            facebook,
            linkedin,
            twitter,
            tiktok,
            youtube,
            carrusel_titulo,
            contenido_ia_titular,
            contenido_ia_bio,
            contenido_ia_servicios,
            contenido_ia_especialidades,
            contenido_ia_horarios,
            meta_title,
            meta_description,
            activa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0)
    `;

    const [result] = await pool.execute(query, [
        id_portafolio,
        id_usuario,
        nombre_profesional,
        profesion,
        tipo_perfil,
        zona_servicio,
        descripcion_personal,
        descripcion_detallada,
        especialidades,
        tono_pagina,
        preferencia_estilo_usuario,
        telefono,
        email_contacto,
        ubicacion,
        horarios,
        whatsapp,
        instagram,
        facebook,
        linkedin,
        twitter,
        tiktok,
        youtube,
        carrusel_titulo
    ]);

    // Devuelve el id del portafolio creado
    return id_portafolio;
};

/**
 * Obtiene todos los portafolios asociados a un usuario específico de la base de datos.
 * 
 * @param {number} id_usuario - Identificador único del usuario.
 * @returns {Promise<Array<Object>>} Lista de portafolios del usuario.
 */
export const obtenerPortafoliosPorUsuario = async (id_usuario) => {
    const query = `
        SELECT id_portafolio, nombre_profesional, profesion, tipo_perfil, slug, activa, fecha_creacion 
        FROM portafolios 
        WHERE id_usuario = ?
    `;
    const [rows] = await pool.execute(query, [id_usuario]);
    return rows;
};

/**
 * Obtiene un portafolio específico por su ID. Opcionalmente filtra por el ID del usuario propietario.
 * 
 * @param {string} id_portafolio - Identificador único del portafolio (UUID).
 * @param {number|null} [id_usuario=null] - Identificador único del usuario propietario (opcional).
 * @returns {Promise<Object|undefined>} El portafolio obtenido o undefined si no existe.
 */
export const obtenerPortafolioPorId = async (id_portafolio, id_usuario) => {

    if (!id_usuario) {
        throw new Error('Se requiere el ID de usuario para acceder a datos privados.');
    }

    if (!id_portafolio) {
        throw new Error('Se requiere el ID del portafolio.');
    }

    const idUsuarioNumerico = Number(id_usuario);

    // Se definen exclusivamente los campos reales de la tabla, omitiendo datos de control
    const columnasSeleccionadas = `
        id_portafolio,
        id_usuario,
        nombre_profesional,
        profesion,
        tipo_perfil,
        zona_servicio,
        slug,
        activa,
        descripcion_personal,
        descripcion_detallada,
        especialidades,
        tono_pagina,
        preferencia_estilo_usuario,
        contenido_ia_titular,
        contenido_ia_bio,
        contenido_ia_servicios,
        contenido_ia_especialidades,
        contenido_ia_horarios,
        telefono,
        email_contacto,
        ubicacion,
        horarios,
        whatsapp,
        instagram,
        facebook,
        linkedin,
        twitter,
        tiktok,
        youtube,
        css_elegido,
        carrusel_titulo,
        meta_title,
        meta_description
    `;

    const query = `
        SELECT ${columnasSeleccionadas} 
        FROM portafolios 
        WHERE id_portafolio = ? AND id_usuario = ?
    `;
    const [rows] = await pool.execute(query, [id_portafolio, idUsuarioNumerico]);
    return rows[0];

};

/**
 * Actualiza los datos generados por IA de un portafolio específico en la base de datos y lo devuelve actualizado.
 * 
 * @param {string} id_portafolio - Identificador único del portafolio (UUID).
 * @param {number} id_usuario - Identificador único del usuario propietario.
 * @param {Object} datosActualizados - Datos del portafolio a actualizar (meta_title, meta_description, contenido_ia_*, css_elegido).
 * @param {string} datosActualizados.meta_title - Título SEO generado
 * @param {string} datosActualizados.meta_description - Descripción SEO generada
 * @param {string} datosActualizados.contenido_ia_titular - Titular H1 generado
 * @param {string} datosActualizados.contenido_ia_bio - Biografía generada
 * @param {string} datosActualizados.contenido_ia_servicios - Servicios generados
 * @param {string} datosActualizados.contenido_ia_especialidades - Especialidades generadas
 * @param {string} datosActualizados.contenido_ia_horarios - Horarios generados en texto natural
 * @param {number} datosActualizados.css_elegido - ID del CSS visual seleccionado por Gemini
 * @returns {Promise<Object>} El portafolio actualizado.
 */
export const actualizarPortafolio = async (id_portafolio, id_usuario, datosActualizados) => {
    const query = `
    UPDATE portafolios 
    SET 
        meta_title = ?, 
        meta_description = ?, 
        contenido_ia_titular = ?, 
        contenido_ia_bio = ?, 
        contenido_ia_servicios = ?,
        contenido_ia_especialidades = ?,
        contenido_ia_horarios = ?,
        css_elegido = ?
    WHERE id_portafolio = ? AND id_usuario = ?
`;

    // Se desglosa el JSON enviando cada valor en orden exacto
    const [result] = await pool.execute(query, [
        datosActualizados.meta_title,
        datosActualizados.meta_description,
        datosActualizados.contenido_ia_titular,
        datosActualizados.contenido_ia_bio,
        datosActualizados.contenido_ia_servicios,
        datosActualizados.contenido_ia_especialidades,
        datosActualizados.contenido_ia_horarios,
        datosActualizados.css_elegido,
        id_portafolio,
        id_usuario
    ]);

    const querySelect = `
        SELECT * FROM portafolios WHERE id_portafolio = ? AND id_usuario = ?
    `;
    const [rows] = await pool.execute(querySelect, [id_portafolio, id_usuario]);
    // Devuelve todo el portafolio actualizado
    return rows[0];
};

/**
 * Comprueba si un slug ya existe en la base de datos.
 * 
 * @param {string} slug - El slug a verificar.
 * @returns {Promise<boolean>} Devuelve true si el slug ya existe, false en caso contrario.
 */
export const verificarSlugUnico = async (slug) => {
    const query = 'SELECT COUNT(*) as count FROM portafolios WHERE slug = ?';
    const [rows] = await pool.execute(query, [slug]);
    return rows[0].count > 0;
};

/**
 * Asigna un slug a un portafolio y lo marca como activo (1).
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {string} slug - El slug a asignar.
 * @returns {Promise<Object>} El portafolio actualizado.
 */
export const activarPortafolio = async (id_portafolio, id_usuario, slug) => {
    const query = `
        UPDATE portafolios
        SET slug = ?, activa = 1
        WHERE id_portafolio = ? AND id_usuario = ?
    `;
    await pool.execute(query, [slug, id_portafolio, id_usuario]);

    const querySelect = `
        SELECT * FROM portafolios WHERE id_portafolio = ? AND id_usuario = ?
    `;
    const [rows] = await pool.execute(querySelect, [id_portafolio, id_usuario]);
    return rows[0];
};

/**
 * Desactiva un portafolio poniendo su slug en NULL y activa a 0.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @returns {Promise<Object>} El portafolio actualizado.
 */
export const desactivarPortafolio = async (id_portafolio, id_usuario) => {
    const query = `
        UPDATE portafolios
        SET slug = NULL, activa = 0
        WHERE id_portafolio = ? AND id_usuario = ?
    `;
    await pool.execute(query, [id_portafolio, id_usuario]);

    const querySelect = `
        SELECT * FROM portafolios WHERE id_portafolio = ? AND id_usuario = ?
    `;
    const [rows] = await pool.execute(querySelect, [id_portafolio, id_usuario]);
    return rows[0];
};

/**
 * Obtiene un portafolio activo por su slug.
 * 
 * @param {string} slug - El slug del portafolio.
 * @returns {Promise<Object|undefined>} El portafolio obtenido o undefined si no existe o no está activo.
 */
export const obtenerPortafolioPorSlug = async (slug) => {
    const columnasSeleccionadas = `
        id_portafolio,
        nombre_profesional,
        profesion,
        tipo_perfil,
        zona_servicio,
        slug,
        contenido_ia_titular,
        contenido_ia_bio,
        contenido_ia_servicios,
        contenido_ia_especialidades,
        contenido_ia_horarios,
        telefono,
        email_contacto,
        ubicacion,
        horarios,
        whatsapp,
        instagram,
        facebook,
        linkedin,
        twitter,
        tiktok,
        youtube,
        css_elegido,
        carrusel_titulo,
        meta_title,
        meta_description
    `;

    const query = `
        SELECT ${columnasSeleccionadas} 
        FROM portafolios 
        WHERE slug = ? AND activa = 1
    `;
    const [rows] = await pool.execute(query, [slug]);
    return rows[0];
};

/**
 * Elimina un portafolio de la base de datos por su ID y el del usuario propietario.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @returns {Promise<number>} Número de filas afectadas.
 */
export const eliminarPortafolio = async (id_portafolio, id_usuario) => {
    const query = 'DELETE FROM portafolios WHERE id_portafolio = ? AND id_usuario = ?';
    const [result] = await pool.execute(query, [id_portafolio, id_usuario]);
    return result.affectedRows;
};

/**
 * Actualiza parcialmente un portafolio con los campos especificados.
 * Construye dinámicamente la cláusula SET de la consulta SQL UPDATE.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {Object} campos - Objeto clave-valor con los campos de la tabla a actualizar.
 * @returns {Promise<number>} Número de filas afectadas.
 */
export const actualizarPortafolioParcial = async (id_portafolio, id_usuario, campos) => {
    // Se guardan las claves de los campos a actualizar
    const keys = Object.keys(campos);
    if (keys.length === 0) return 0;

    // Validación estricta de identificadores en el DAO
    const safeKeysPattern = /^[a-zA-Z0-9_]+$/;
    for (const key of keys) {
        if (!safeKeysPattern.test(key)) {
            throw new Error(`Identificador de columna no seguro detectado en el DAO: ${key}`);
        }
    }

    // Se construye la cláusula SET de la consulta SQL
    const setClauses = keys.map(key => `\`${key}\` = ?`).join(', ');

    // Se guardan los valores de los campos a actualizar
    const values = keys.map(key => campos[key]);

    // Se construye la consulta SQL con la cláusula SET dinámica
    const query = `
        UPDATE portafolios 
        SET ${setClauses} 
        WHERE id_portafolio = ? AND id_usuario = ?
    `;

    const [result] = await pool.execute(query, [...values, id_portafolio, id_usuario]);
    return result.affectedRows;
};




