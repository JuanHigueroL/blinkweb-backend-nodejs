import * as imagenDao from '../daos/imagenDao.js';
import * as portafolioDao from '../daos/portafolioDao.js';
import { eliminarArchivoFisico } from '../utils/fileHelper.js';

/**
 * Elimina una imagen de la base de datos y físicamente del disco, verificando la propiedad del portafolio asociado.
 * 
 * @param {number} id_imagen - ID autoincremental de la imagen.
 * @param {number} id_usuario - ID del usuario autenticado solicitando el borrado.
 * @returns {Promise<boolean>} True si se eliminó con éxito.
 */
export const eliminarImagenFisicaYDb = async (id_imagen, id_usuario) => {
    try {
        // 1. Obtener la metadata de la imagen
        const imagen = await imagenDao.obtenerImagenPorId(id_imagen);
        if (!imagen) {
            const error = new Error('Imagen no encontrada.');
            error.statusCode = 404;
            throw error;
        }

        // 2. Obtener el portafolio para comprobar pertenencia al usuario
        const portafolio = await portafolioDao.obtenerPortafolioPorId(imagen.id_portafolio, id_usuario);
        if (!portafolio) {
            const error = new Error('El portafolio no pertenece al usuario.');
            error.statusCode = 403;
            throw error;
        }

        // 3. Eliminar el registro en la base de datos y el archivo físico de forma paralela
        await Promise.all([
            imagenDao.eliminarImagen(id_imagen),
            eliminarArchivoFisico(imagen.nombre_archivo)
        ]);

        return true;
    } catch (error) {
        console.error('Error en servicio eliminarImagenFisicaYDb:', error.message);
        throw error;
    }
};
