import pool from '../config/db.js';

/**
 * Inserta una nueva imagen asociada a un portafolio en la base de datos.
 * 
 * @param {Object} datosImagen - Datos de la imagen a registrar.
 * @param {string} datosImagen.id_portafolio - ID del portafolio (UUID).
 * @param {string} datosImagen.tipo - Tipo de imagen ('logo', 'portada', 'galeria').
 * @param {string} datosImagen.nombre_archivo - Nombre del archivo físico guardado.
 * @param {string} datosImagen.url_publica - URL pública de acceso (ej: /imagenes/nombre.ext).
 * @param {string} [datosImagen.mime_type=null] - Tipo MIME del archivo.
 * @param {number} [datosImagen.tamanio_bytes=null] - Tamaño en bytes del archivo.
 * @param {number} datosImagen.orden - Orden de la imagen en la galería.
 * @returns {Promise<number>} ID autoincremental de la imagen insertada.
 */
export const insertarImagen = async (datosImagen) => {
    const {
        id_portafolio,
        tipo,
        nombre_archivo,
        url_publica,
        mime_type = null,
        tamanio_bytes = null,
        orden
    } = datosImagen;

    const query = `
        INSERT INTO imagenes (
            id_portafolio,
            tipo,
            nombre_archivo,
            url_publica,
            mime_type,
            tamanio_bytes,
            orden
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
        id_portafolio,
        tipo,
        nombre_archivo,
        url_publica,
        mime_type,
        tamanio_bytes,
        orden
    ]);

    return result.insertId;
};

/**
 * Obtiene todas las imágenes asociadas a un portafolio.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @returns {Promise<Array<Object>>} Lista de imágenes ordenadas por orden ASC.
 */
export const obtenerImagenesPorPortafolio = async (id_portafolio) => {
    const query = `
        SELECT * FROM imagenes WHERE id_portafolio = ? ORDER BY orden ASC
    `;
    const [rows] = await pool.execute(query, [id_portafolio]);
    return rows;
};

/**
 * Obtiene una imagen por su ID.
 * 
 * @param {number} id_imagen - ID autoincremental de la imagen.
 * @returns {Promise<Object|undefined>} Objeto de la imagen o undefined si no existe.
 */
export const obtenerImagenPorId = async (id_imagen) => {
    const query = 'SELECT * FROM imagenes WHERE id_imagen = ?';
    const [rows] = await pool.execute(query, [id_imagen]);
    return rows[0];
};

/**
 * Elimina el registro de una imagen de la base de datos por su ID.
 * 
 * @param {number} id_imagen - ID autoincremental de la imagen.
 * @returns {Promise<number>} Número de filas afectadas.
 */
export const eliminarImagen = async (id_imagen) => {
    const query = 'DELETE FROM imagenes WHERE id_imagen = ?';
    const [result] = await pool.execute(query, [id_imagen]);
    return result.affectedRows;
};

/**
 * Obtiene el valor máximo de la columna 'orden' para un portafolio y tipo de imagen específicos.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {string} tipo - Tipo de imagen ('galeria', etc).
 * @returns {Promise<number>} El orden máximo o -1 si no hay imágenes de ese tipo.
 */
export const obtenerMaxOrdenPorPortafolioYTipo = async (id_portafolio, tipo) => {
    const query = 'SELECT MAX(orden) as max_orden FROM imagenes WHERE id_portafolio = ? AND tipo = ?';
    const [rows] = await pool.execute(query, [id_portafolio, tipo]);
    return rows[0]?.max_orden !== null ? rows[0].max_orden : -1;
};

/**
 * Elimina todos los registros de imágenes de un portafolio y tipo específicos en la BD.
 * Se suele utilizar para reemplazar logos o portadas ya existentes.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {string} tipo - Tipo de imagen ('logo', 'portada').
 * @returns {Promise<number>} Número de filas afectadas.
 */
export const eliminarImagenPorPortafolioYTipo = async (id_portafolio, tipo) => {
    const query = 'DELETE FROM imagenes WHERE id_portafolio = ? AND tipo = ?';
    const [result] = await pool.execute(query, [id_portafolio, tipo]);
    return result.affectedRows;
};

/**
 * Inserta múltiples imágenes en la base de datos de manera masiva (Bulk Insert)
 * ejecutando una sola consulta SQL.
 * 
 * @param {Array<Object>} listaImagenes - Lista de objetos de imagen
 * @returns {Promise<Object>} Resultado de la ejecución de MySQL
 */
export const insertarImagenesMasivo = async (listaImagenes) => {
    if (!listaImagenes || listaImagenes.length === 0) return null;

    const placeholders = listaImagenes.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const query = `
        INSERT INTO imagenes (
            id_portafolio,
            tipo,
            nombre_archivo,
            url_publica,
            mime_type,
            tamanio_bytes,
            orden
        ) VALUES ${placeholders}
    `;

    const values = listaImagenes.flatMap(img => [
        img.id_portafolio,
        img.tipo,
        img.nombre_archivo,
        img.url_publica,
        img.mime_type || null,
        img.tamanio_bytes || null,
        img.orden
    ]);

    const [result] = await pool.execute(query, values);
    return result;
};



