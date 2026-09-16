import * as imagenService from '../services/imagenService.js';

/**
 * Controlador para la eliminación de una imagen por su ID.
 * Valida la propiedad del portafolio al cual pertenece la imagen.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 */
export const eliminarImagen = async (req, res) => {
    try {
        const { id_imagen } = req.params;
        const id_usuario = req.usuario?.id_usuario;

        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        if (!id_imagen) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El parámetro id_imagen es obligatorio.'
            });
        }

        await imagenService.eliminarImagenFisicaYDb(id_imagen, id_usuario);

        return res.status(200).json({
            exito: true,
            mensaje: 'Imagen eliminada correctamente del servidor y la base de datos.'
        });
    } catch (error) {
        console.error('Error en eliminarImagen (Controller):', error.message);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al eliminar la imagen.'
        });
    }
};
