import * as portafolioService from '../services/portafolioService.js';
import * as iaService from '../services/iaService.js';
import * as imagenDao from '../daos/imagenDao.js';
import * as portafolioDao from '../daos/portafolioDao.js';
import { generarSlugBase } from '../utils/slugGenerator.js';
import fs from 'fs';

/**
 * Controlador para la creación de un nuevo portafolio.
 * Valida la presencia de nombre_profesional, profesion y preferencia_estilo_usuario, llama al servicio y responde con 201 Created.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP con los datos del portafolio creado.
 * Devuelve el id de portafolio (UUID)
 */
export const crearPortafolio = async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        const { nombre_profesional, profesion, tipo_perfil, preferencia_estilo_usuario } = req.body;

        // 1. Validar la existencia del ID del usuario autenticado
        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        // 2. Validar que existan los campos obligatorios
        if (!nombre_profesional || !profesion) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Campos requeridos faltantes: nombre_profesional y profesion son obligatorios.'
            });
        }

        // Validación de tipo_perfil si se proporciona
        if (tipo_perfil && tipo_perfil !== 'particular' && tipo_perfil !== 'empresa') {
            return res.status(400).json({
                exito: false,
                mensaje: 'El campo tipo_perfil debe ser "particular" o "empresa".'
            });
        }

        // Validación de preferencia_estilo_usuario si se proporciona
        if (preferencia_estilo_usuario && typeof preferencia_estilo_usuario !== 'string') {
            return res.status(400).json({
                exito: false,
                mensaje: 'El campo preferencia_estilo_usuario debe ser una cadena de texto.'
            });
        }

        // Delegar la creación del portafolio al servicio correspondiente sin Gemini
        const id_portafolio = await portafolioService.crearNuevoPortafolio(id_usuario, req.body, req.files);


        // Responder con código 201 Created con el ID y los datos del portafolio
        return res.status(201).json({
            exito: true,
            mensaje: 'Portafolio creado exitosamente.',
            resultado: id_portafolio // Devuelve el id de portafolio
        });

    } catch (error) {
        console.error('Error en crearPortafolio (Controller):', error.message);

        // Limpieza de archivos huérfanos si ocurre un error
        if (req.files) {
            // Recorre los archivos recibidos en el request y los elimina de la base de datos
            for (const [campo, archivos] of Object.entries(req.files)) {
                for (const archivo of archivos) {
                    // fs.unlink es una función asíncrona que elimina un archivo del sistema de archivos
                    // archivo.path es la ruta del archivo
                    fs.unlink(archivo.path, (err) => {
                        if (err) {
                            console.error(`Error al eliminar archivo huérfano ${archivo.path}:`, err.message);
                        } else {
                            console.log(`Archivo huérfano eliminado con éxito: ${archivo.path}`);
                        }
                    });
                }
            }
        }

        // Responder con código 500 si ocurre algún error
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al procesar la creación del portafolio.'
        });
    }
};

/**
 * Controlador para obtener todos los portafolios del usuario autenticado.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP con la lista de portafolios del usuario.
 * Devuelve solo id_portafolio, nombre_profesional, profesion, slug y activa
 */
export const obtenerPortafoliosPorUsuario = async (req, res) => {
    try {
        const id_usuario = req.usuario?.id_usuario;
        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }
        const portafolios = await portafolioService.obtenerPortafoliosPorUsuario(id_usuario);
        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolios obtenidos exitosamente.',
            resultado: portafolios // Devuelve solo id_portafolio, nombre_profesional, profesion, slug y activa
        });
    } catch (error) {
        console.error('Error en obtenerPortafoliosPorUsuario (Controller):', error.message);
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al procesar la obtención de los portafolios.'
        });
    }
};


/**
 * Controlador para generar y actualizar el contenido SEO e IA de un portafolio usando Gemini.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP con el portafolio actualizado con el contenido generado.
 */
export const generarContenidoPortafolio = async (req, res) => {
    try {
        let id_portafolio = req.params.id;
        if (id_portafolio && typeof id_portafolio === 'string') {
            id_portafolio = id_portafolio.trim();
        }

        if (!id_portafolio) {
            return res.status(400).json({
                exito: false,
                mensaje: 'No autorizado: Falta el ID del portafolio en la solicitud.'
            });
        }

        const id_usuario = req.usuario?.id_usuario;
        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        console.log(`Depuración (generarContenidoPortafolio) - id_portafolio: "${id_portafolio}" (tipo: ${typeof id_portafolio}), id_usuario: "${id_usuario}" (tipo: ${typeof id_usuario})`);
        const portafolio = await portafolioService.obtenerPortafolioPorId(id_portafolio, id_usuario);

        if (!portafolio) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No encontrado: El portafolio no existe o no tiene permisos para verlo.'
            });
        }

        const contenidogenerado = await iaService.generarContenidoPortafolio(portafolio);

        await portafolioService.actualizarPortafolioConIA(id_portafolio, id_usuario, contenidogenerado);

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio generado exitosamente.',
            resultado: { id_portafolio }
        });
    } catch (error) {
        console.error('Error en obtenerPortafolioPorId (Controller):', error.message);
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al procesar la obtención del portafolio.'
        });
    }
}

/**
 * Controlador para publicar un portafolio.
 * Si recibe req.body.slug (manual), comprueba si está en uso. Si lo está, devuelve 409 Conflict.
 * Si no lo recibe, genera un slug autónomo basado en el nombre del profesional.
 * Luego, activa el portafolio en la base de datos y responde con los datos en formato DTO.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP con el portafolio publicado (DTO).
 * Devuelve el id, nombre_profesional, profesion, slug y estado del portafolio.
 */
export const publicarPortafolio = async (req, res) => {
    try {
        let id_portafolio = req.params.id;
        if (id_portafolio && typeof id_portafolio === 'string') {
            id_portafolio = id_portafolio.trim();
        }

        const id_usuario = req.usuario?.id_usuario;

        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        if (!id_portafolio) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El ID del portafolio es obligatorio.'
            });
        }

        // Obtener el portafolio para verificar existencia/propietario
        console.log(`Depuración (publicarPortafolio) - id_portafolio: "${id_portafolio}" (tipo: ${typeof id_portafolio}), id_usuario: "${id_usuario}" (tipo: ${typeof id_usuario})`);
        const portafolio = await portafolioService.obtenerPortafolioPorId(id_portafolio, id_usuario);
        if (!portafolio) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No encontrado: El portafolio no existe o no tiene permisos para modificarlo.'
            });
        }

        const manualSlug = generarSlugBase(req.body.slug);
        let slugDefinitivo;

        if (manualSlug) {
            // Verificar si el slug manual ya está en uso
            const existe = await portafolioService.verificarSlugExistente(manualSlug);
            if (existe) {
                return res.status(409).json({
                    exito: false,
                    mensaje: `El slug '${manualSlug}' ya está en uso. Elige otro.`
                });
            }
            slugDefinitivo = manualSlug;
        } else {
            // Generar slug autónomo basado en nombre_profesional
            if (!portafolio.nombre_profesional) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'No se puede generar un slug automático porque el portafolio no tiene nombre_profesional.'
                });
            }
            slugDefinitivo = await portafolioService.generarSlugAutonomo(portafolio.nombre_profesional, portafolio.profesion);
        }

        // Publicar portafolio
        const portafolioPublicado = await portafolioService.publicarPortafolio(id_portafolio, id_usuario, slugDefinitivo);

        // Patrón DTO: Filtrar los datos a retornar
        const resultadoDTO = {
            id_portafolio: portafolioPublicado.id_portafolio,
            nombre_profesional: portafolioPublicado.nombre_profesional,
            profesion: portafolioPublicado.profesion,
            tipo_perfil: portafolioPublicado.tipo_perfil,
            slug: portafolioPublicado.slug,
            activa: portafolioPublicado.activa
        };

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio publicado exitosamente.',
            resultado: resultadoDTO
        });
    } catch (error) {
        console.error('Error en publicarPortafolio (Controller):', error.message);
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al publicar el portafolio.'
        });
    }
};

/**
 * Controlador para ocultar/desactivar un portafolio.
 * Cambia el estado de activa a 0 y borra el slug (null).
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} La respuesta HTTP indicando el éxito y el DTO resultante.
 */
export const ocultarPortafolio = async (req, res) => {
    try {
        let id_portafolio = req.params.id;
        if (id_portafolio && typeof id_portafolio === 'string') {
            id_portafolio = id_portafolio.trim();
        }

        const id_usuario = req.usuario?.id_usuario;

        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        if (!id_portafolio) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El ID del portafolio es obligatorio.'
            });
        }

        // Verificar existencia y pertenencia
        console.log(`Depuración (ocultarPortafolio) - id_portafolio: "${id_portafolio}" (tipo: ${typeof id_portafolio}), id_usuario: "${id_usuario}" (tipo: ${typeof id_usuario})`);
        const portafolio = await portafolioService.obtenerPortafolioPorId(id_portafolio, id_usuario);
        if (!portafolio) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No encontrado: El portafolio no existe o no tiene permisos para modificarlo.'
            });
        }

        // Desactivar portafolio
        const portafolioDesactivado = await portafolioService.desactivarPortafolio(id_portafolio, id_usuario);

        // Patrón DTO
        const resultadoDTO = {
            id_portafolio: portafolioDesactivado.id_portafolio,
            nombre_profesional: portafolioDesactivado.nombre_profesional,
            profesion: portafolioDesactivado.profesion,
            tipo_perfil: portafolioDesactivado.tipo_perfil,
            slug: portafolioDesactivado.slug,
            activa: portafolioDesactivado.activa
        };

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio desactivado exitosamente.',
            resultado: resultadoDTO
        });
    } catch (error) {
        console.error('Error en ocultarPortafolio (Controller):', error.message);
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al desactivar el portafolio.'
        });
    }
};

/**
 * Controlador para obtener un portafolio completo por su ID, incluyendo sus imágenes estructuradas.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} Respuesta HTTP con el portafolio completo estructurado y código 200, u error 404/500.
 */
export const obtenerPortafolio = async (req, res) => {
    try {
        let id_portafolio = req.params.id;
        if (id_portafolio && typeof id_portafolio === 'string') {
            id_portafolio = id_portafolio.trim();
        }

        if (!id_portafolio) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El ID del portafolio es obligatorio.'
            });
        }

        const id_usuario = req.usuario?.id_usuario;
        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        const portafolioCompleto = await portafolioService.obtenerPortafolioCompleto(id_portafolio, id_usuario);
        if (!portafolioCompleto) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No encontrado: El portafolio no existe o no tiene permisos para modificarlo.'
            });
        }

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio obtenido exitosamente.',
            resultado: portafolioCompleto
        });
    } catch (error) {
        console.error('Error en obtenerPortafolio (Controller):', error.message);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al obtener el portafolio.'
        });
    }
};

/**
 * Controlador para obtener un portafolio público completo por su slug, incluyendo sus imágenes estructuradas.
 * No requiere autenticación y solo devuelve portafolios publicados (activa = 1).
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} Respuesta HTTP con el portafolio completo estructurado y código 200, u error 404/500.
 */
export const obtenerPortafolioPublico = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El parámetro slug es obligatorio.'
            });
        }

        const portafolioPublico = await portafolioService.obtenerPortafolioPublico(slug);

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio público obtenido exitosamente.',
            resultado: portafolioPublico
        });
    } catch (error) {
        console.error('Error en obtenerPortafolioPublico (Controller):', error.message);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al obtener el portafolio público.'
        });
    }
};

/**
 * Controlador para eliminar un portafolio completo (base de datos y archivos físicos).
 * Requiere autenticación y que el portafolio pertenezca al usuario.
 * 
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<Object>} Respuesta HTTP indicando el éxito del borrado.
 */
export const borrarPortafolio = async (req, res) => {
    try {
        let id_portafolio = req.params.id;
        if (id_portafolio && typeof id_portafolio === 'string') {
            id_portafolio = id_portafolio.trim();
        }

        const id_usuario = req.usuario?.id_usuario;

        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        if (!id_portafolio) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El ID del portafolio es obligatorio.'
            });
        }

        await portafolioService.eliminarPortafolioCompleto(id_portafolio, id_usuario);

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio y archivos asociados eliminados correctamente.'
        });
    } catch (error) {
        console.error('Error en borrarPortafolio (Controller):', error.message);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al eliminar el portafolio.'
        });
    }
};

/**
 * Controlador para la edición parcial de los textos y redes sociales de un portafolio.
 */
export const editarTextos = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_perfil, css_elegido } = req.body;
        const id_usuario = req.usuario?.id_usuario;

        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        // 1. Comprobar que el campo tipo_perfil existe y tiene algún valor real
        if (tipo_perfil !== undefined && tipo_perfil !== null && tipo_perfil !== '') {
            // 2. Si tiene contenido, exigir que sea estrictamente uno de los formatos permitidos
            if (tipo_perfil !== 'particular' && tipo_perfil !== 'empresa') {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El campo tipo_perfil debe ser "particular" o "empresa".'
                });
            }
        }

        // Validación estricta de css_elegido
        if (css_elegido !== undefined && css_elegido !== null && css_elegido !== '') {
            const parsedCss = Number(css_elegido);
            const isValido = (typeof css_elegido === 'number' || typeof css_elegido === 'string') &&
                             Number.isInteger(parsedCss) &&
                             parsedCss >= 1 &&
                             parsedCss <= 8;
            if (!isValido) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El campo css_elegido debe ser un número entero entre 1 y 8 (ambos inclusive).'
                });
            }
        }

        // Validación previa de propiedad
        const portafolioExistente = await portafolioDao.obtenerPortafolioPorId(id, id_usuario);
        if (!portafolioExistente) {
            return res.status(403).json({
                exito: false,
                mensaje: 'El portafolio no pertenece al usuario o no existe.'
            });
        }

        const portafolioActualizado = await portafolioService.actualizarTextosPortafolio(id, id_usuario, req.body);

        return res.status(200).json({
            exito: true,
            mensaje: 'Portafolio actualizado exitosamente.',
            datos: portafolioActualizado
        });
    } catch (error) {
        console.error('Error en editarTextos (Controller):', error.message);
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al editar los textos.'
        });
    }
};

/**
 * Controlador para subir nuevas imágenes al portafolio.
 */
export const subirImagenes = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.usuario?.id_usuario;

        if (id_usuario === undefined || id_usuario === null) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Token inválido o usuario no identificado'
            });
        }

        // Validación previa de propiedad
        const portafolioExistente = await portafolioDao.obtenerPortafolioPorId(id, id_usuario);
        if (!portafolioExistente) {
            // Limpieza de archivos huérfanos subidos en esta petición si el portafolio no existe
            if (req.files) {
                for (const [campo, archivos] of Object.entries(req.files)) {
                    for (const archivo of archivos) {
                        fs.unlink(archivo.path, () => { });
                    }
                }
            }
            return res.status(403).json({
                exito: false,
                mensaje: 'El portafolio no pertenece al usuario o no existe.'
            });
        }

        if (Number(portafolioExistente.id_usuario) !== Number(id_usuario)) {
            // Limpieza de archivos huérfanos subidos en esta petición si no pertenece al usuario
            if (req.files) {
                for (const [campo, archivos] of Object.entries(req.files)) {
                    for (const archivo of archivos) {
                        fs.unlink(archivo.path, () => { });
                    }
                }
            }
            return res.status(403).json({
                exito: false,
                mensaje: 'No tiene permisos para modificar este portafolio.'
            });
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Debe proporcionar al menos una imagen en los campos logo, portada o galeria.'
            });
        }

        await portafolioService.añadirImagenesAPortafolio(id, req.files);

        const rutasImagenes = await portafolioService.obtenerRutasImagenesPortafolio(id);
        return res.status(201).json({
            exito: true,
            mensaje: 'Imágenes añadidas exitosamente.',
            datos: rutasImagenes
        });
    } catch (error) {
        console.error('Error en subirImagenes (Controller):', error.message);
        // Limpieza de archivos huérfanos en caso de error general
        if (req.files) {
            for (const [campo, archivos] of Object.entries(req.files)) {
                for (const archivo of archivos) {
                    fs.unlink(archivo.path, () => { });
                }
            }
        }
        return res.status(500).json({
            exito: false,
            mensaje: error.message || 'Error interno del servidor al procesar la carga de imágenes.'
        });
    }
};




