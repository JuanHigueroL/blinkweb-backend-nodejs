import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import * as portafolioDao from '../daos/portafolioDao.js';
import * as imagenDao from '../daos/imagenDao.js';
import { generarSlugBase } from '../utils/slugGenerator.js';
import { eliminarArchivoFisico } from '../utils/fileHelper.js';

/**
 * Coordina la creación completa del portafolio.
 * Guarda los datos del formulario directamente en la base de datos sin interacción con la IA.
 * 
 * @param {number} id_usuario - ID del usuario que solicita la creación
 * @param {Object} datosFormulario - Datos del portafolio rellenados por el usuario
 * @returns {Promise<Object>} El portafolio creado
 */
export const crearNuevoPortafolio = async (id_usuario, datosFormulario, files) => {
    try {
        const datosPortafolio = {
            id_usuario,
            ...datosFormulario
        };

        // Insertar en la base de datos
        const id_portafolio = await portafolioDao.insertarPortafolio(datosPortafolio);

        // Guardar imágenes en la base de datos vinculadas al UUID obtenido
        if (files) {
            const maxOrdenActual = await imagenDao.obtenerMaxOrdenPorPortafolioYTipo(id_portafolio, 'galeria');
            let siguienteOrdenGaleria = maxOrdenActual + 1;
            const listaImagenes = [];

            //Recorre los archivos subidos
            for (const [campo, archivos] of Object.entries(files)) {
                for (const archivo of archivos) {
                    let ordenAsignado = 0;
                    if (campo === 'galeria') {
                        ordenAsignado = siguienteOrdenGaleria;
                        siguienteOrdenGaleria++;
                    }

                    if (ordenAsignado <= 10) {
                        listaImagenes.push({
                            id_portafolio,
                            tipo: campo,
                            nombre_archivo: archivo.filename,
                            url_publica: `/imagenes/${archivo.filename}`,
                            mime_type: archivo.mimetype,
                            tamanio_bytes: archivo.size,
                            orden: ordenAsignado
                        });
                    }
                }
            }

            if (listaImagenes.length > 0) {
                await imagenDao.insertarImagenesMasivo(listaImagenes);
            }
        }

        // Retornar el id del portafolio creado
        return id_portafolio;

    } catch (error) {
        console.error('Error en servicio crearNuevoPortafolio:', error.message);
        throw error;
    }
};

/**
 * Obtiene la lista de portafolios asociados a un usuario específico.
 * 
 * @param {number} id_usuario - Identificador único del usuario.
 * @returns {Promise<Array<Object>>} Lista de portafolios del usuario.
 */
export const obtenerPortafoliosPorUsuario = async (id_usuario) => {
    try {
        const portafolios = await portafolioDao.obtenerPortafoliosPorUsuario(id_usuario);
        return portafolios;
    } catch (error) {
        console.error('Error en servicio obtenerPortafoliosPorUsuario:', error.message);
        throw error;
    }
};


/**
 * Actualiza el contenido generado de un portafolio existente.
 * 
 * @param {string} id_portafolio - Identificador único del portafolio (UUID).
 * @param {number} id_usuario - Identificador único del usuario propietario.
 * @param {Object} datosActualizados - Nuevos datos para el portafolio (meta_title, meta_description, contenido_ia_*).
 * @returns {Promise<Object>} El portafolio actualizado con sus nuevos datos.
 */
export const actualizarPortafolioConIA = async (id_portafolio, id_usuario, datosActualizados) => {
    try {
        const portafolioActualizado = await portafolioDao.actualizarPortafolio(id_portafolio, id_usuario, datosActualizados);
        return portafolioActualizado;
    } catch (error) {
        console.error('Error en servicio actualizarPortafolio:', error.message);
        throw error;
    }
};


/**
 * Obtiene un portafolio específico por su ID, validando que pertenezca al usuario.
 * 
 * @param {string} id_portafolio - Identificador único del portafolio (UUID).
 * @param {number} id_usuario - Identificador único del usuario propietario.
 * @returns {Promise<Object|null>} El portafolio obtenido, o null si no se encuentra o no pertenece al usuario.
 */
export const obtenerPortafolioPorId = async (id_portafolio, id_usuario) => {
    try {
        const portafolio = await portafolioDao.obtenerPortafolioPorId(id_portafolio, id_usuario);
        return portafolio;
    } catch (error) {
        console.error('Error en servicio obtenerPortafolioPorId:', error.message);
        throw error;
    }
};

/**
 * Verifica si un slug ya está registrado en la base de datos.
 * 
 * @param {string} slug - El slug a verificar.
 * @returns {Promise<boolean>} Devuelve true si el slug ya existe, false en caso contrario.
 */
export const verificarSlugExistente = async (slug) => {
    try {
        return await portafolioDao.verificarSlugUnico(slug);
    } catch (error) {
        console.error('Error en servicio verificarSlugExistente:', error.message);
        throw error;
    }
};

/**
 * Genera de forma autónoma un slug único para un profesional.
 * Si el slug base ya existe, añade un sufijo hexadecimal corto y reintenta.
 * 
 * @param {string} nombre_profesional - El nombre del profesional.
 * @param {string} profesion - La profesión del profesional.
 * @returns {Promise<string>} El slug único definitivo.
 */
export const generarSlugAutonomo = async (nombre_profesional, profesion) => {
    try {
        // Genera un slug base a partir del nombre del profesional
        const slugBase = generarSlugBase(nombre_profesional);
        let slugDefinitivo = slugBase;
        // Comprueba si el slug existe
        let existe = await verificarSlugExistente(slugDefinitivo);

        if (existe) {
            // Si el slug existe, genera otro slug a partir del nombre del profesional y su profesión
            slugDefinitivo = generarSlugBase(nombre_profesional + ' ' + profesion);
        }

        existe = await verificarSlugExistente(slugDefinitivo);

        //Si existe genera otro slug con sufijo hex
        while (existe) {
            // Genera un sufijo hex de 3 bytes para añadirlo al final del slug base
            const sufijo = crypto.randomBytes(3).toString('hex');
            // Concatena el sufijo hex al slug base
            slugDefinitivo = `${slugBase}-${sufijo}`;
            // Comprueba si el slug existe
            existe = await verificarSlugExistente(slugDefinitivo);
        }

        return slugDefinitivo;
    } catch (error) {
        console.error('Error en servicio generarSlugAutonomo:', error.message);
        throw error;
    }
};

/**
 * Publica un portafolio asignándole un slug definitivo y activándolo.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {string} slug - El slug definitivo a asociar.
 * @returns {Promise<Object>} El portafolio actualizado.
 */
export const publicarPortafolio = async (id_portafolio, id_usuario, slug) => {
    try {
        return await portafolioDao.activarPortafolio(id_portafolio, id_usuario, slug);
    } catch (error) {
        console.error('Error en servicio publicarPortafolio:', error.message);
        throw error;
    }
};

/**
 * Oculta/desactiva un portafolio anulando su slug y poniéndolo como inactivo.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @returns {Promise<Object>} El portafolio actualizado.
 */
export const desactivarPortafolio = async (id_portafolio, id_usuario) => {
    try {
        return await portafolioDao.desactivarPortafolio(id_portafolio, id_usuario);
    } catch (error) {
        console.error('Error en servicio desactivarPortafolio:', error.message);
        throw error;
    }
};

/**
 * Recupera un portafolio completo por su ID, estructurando sus imágenes asociadas.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @returns {Promise<Object>} El portafolio completo con imágenes agrupadas por tipo.
 */
export const obtenerPortafolioCompleto = async (id_portafolio, id_usuario) => {
    try {
        // 1. Obtener el portafolio
        const portafolio = await portafolioDao.obtenerPortafolioPorId(id_portafolio, id_usuario);

        if (!portafolio) {
            const error = new Error('Portafolio no encontrado.');
            error.statusCode = 404;
            throw error;
        }

        // 2. Obtener imágenes asociadas
        const imagenes = await imagenDao.obtenerImagenesPorPortafolio(id_portafolio);

        // 3. Estructurar imágenes agrupándolas por tipo
        const imagenesEstructuradas = {
            logo: null,
            portada: null,
            galeria: []
        };

        // Itera sobre las imágenes y las asigna al tipo correspondiente
        for (const img of imagenes) {
            if (img.tipo === 'logo') {
                imagenesEstructuradas.logo = img;
            } else if (img.tipo === 'portada') {
                imagenesEstructuradas.portada = img;
            } else if (img.tipo === 'galeria') {
                imagenesEstructuradas.galeria.push(img);
            }
        }

        // Optimización: evitar enviar un array vacío si la galería está vacía
        if (imagenesEstructuradas.galeria.length === 0) {
            imagenesEstructuradas.galeria = null;
        }

        // 4. Devolver portafolio con las imágenes estructuradas
        return {
            ...portafolio,
            imagenes: imagenesEstructuradas
        };

    } catch (error) {
        console.error('Error en servicio obtenerPortafolioCompleto:', error.message);
        throw error;
    }
};

/**
 * Obtiene un portafolio público completo por su slug, estructurando sus imágenes asociadas.
 * Solo recupera portafolios publicados (activa = 1).
 * 
 * @param {string} slug - El slug del portafolio.
 * @returns {Promise<Object>} El portafolio con las imágenes estructuradas.
 */
export const obtenerPortafolioPublico = async (slug) => {
    try {
        // 1. Obtener el portafolio activo por slug
        const portafolio = await portafolioDao.obtenerPortafolioPorSlug(slug);

        if (!portafolio) {
            const error = new Error('Portafolio no encontrado o no está activo.');
            error.statusCode = 404;
            throw error;
        }

        // 2. Obtener imágenes asociadas
        const imagenes = await imagenDao.obtenerImagenesPorPortafolio(portafolio.id_portafolio);

        // 3. Estructurar imágenes agrupándolas por tipo
        const imagenesEstructuradas = {
            logo: null,
            portada: null,
            galeria: []
        };

        for (const img of imagenes) {
            if (img.tipo === 'logo') {
                imagenesEstructuradas.logo = img;
            } else if (img.tipo === 'portada') {
                imagenesEstructuradas.portada = img;
            } else if (img.tipo === 'galeria') {
                imagenesEstructuradas.galeria.push(img);
            }
        }

        // Optimización: evitar enviar un array vacío si la galería está vacía
        if (imagenesEstructuradas.galeria.length === 0) {
            imagenesEstructuradas.galeria = null;
        }

        // 4. Devolver portafolio con las imágenes estructuradas
        return {
            ...portafolio,
            imagenes: imagenesEstructuradas
        };

    } catch (error) {
        console.error('Error en servicio obtenerPortafolioPublico:', error.message);
        throw error;
    }
};

/**
 * Elimina un portafolio completo de la base de datos y de manera física todas sus imágenes.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @returns {Promise<boolean>} True si la eliminación fue exitosa.
 */
export const eliminarPortafolioCompleto = async (id_portafolio, id_usuario) => {
    try {
        // 1. Validar existencia y propiedad del portafolio
        const portafolio = await portafolioDao.obtenerPortafolioPorId(id_portafolio, id_usuario);
        if (!portafolio) {
            const error = new Error('Portafolio no encontrado o no tiene permisos para eliminarlo.');
            error.statusCode = 404;
            throw error;
        }

        // 2. Obtener imágenes asociadas antes de borrarlas de la base de datos
        const imagenes = await imagenDao.obtenerImagenesPorPortafolio(id_portafolio);

        // 3. Eliminar el portafolio en la base de datos
        const afectadas = await portafolioDao.eliminarPortafolio(id_portafolio, id_usuario);

        if (afectadas > 0) {
            // 4. Si la eliminación en BD fue exitosa, borrar las imágenes físicas en paralelo de forma segura
            const promesasBorrado = imagenes
                .filter(img => img.nombre_archivo)
                .map(img => eliminarArchivoFisico(img.nombre_archivo));
            await Promise.all(promesasBorrado); // Espera a que todas las imágenes se eliminen
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error en servicio eliminarPortafolioCompleto:', error.message);
        throw error;
    }
};

/**
 * Actualiza parcialmente los campos de texto y redes sociales de un portafolio.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {number} id_usuario - ID del usuario propietario.
 * @param {Object} datos - Objeto con los campos parciales a actualizar.
 * @returns {Promise<Object>} Los datos de texto y visuales del portafolio actualizado.
 */
export const actualizarTextosPortafolio = async (id_portafolio, id_usuario, datos) => {
    try {
        const camposPermitidos = [
            'nombre_profesional',
            'profesion',
            'tipo_perfil',
            'zona_servicio',
            'contenido_ia_titular',
            'contenido_ia_bio',
            'contenido_ia_servicios',
            'contenido_ia_especialidades',
            'contenido_ia_horarios',
            'telefono',
            'email_contacto',
            'ubicacion',
            'whatsapp',
            'instagram',
            'facebook',
            'linkedin',
            'twitter',
            'tiktok',
            'youtube',
            'carrusel_titulo',
            'css_elegido'
        ];

        const camposAActualizar = {};

        // Copiar campos planos permitidos
        camposPermitidos.forEach(campo => {
            if (datos[campo] !== undefined) {
                camposAActualizar[campo] = datos[campo];
            }
        });

        // Si no hay nada que actualizar, retornar el portafolio filtrado actual directamente
        if (Object.keys(camposAActualizar).length === 0) {
            const portafolio = await portafolioDao.obtenerPortafolioPorId(id_portafolio, id_usuario);
            if (!portafolio) {
                const error = new Error('Portafolio no encontrado.');
                error.statusCode = 404;
                throw error;
            }
            return filtrarCamposTexto(portafolio);
        }

        await portafolioDao.actualizarPortafolioParcial(id_portafolio, id_usuario, camposAActualizar);

        const portafolio = await portafolioDao.obtenerPortafolioPorId(id_portafolio, id_usuario);
        if (!portafolio) {
            const error = new Error('Portafolio no encontrado.');
            error.statusCode = 404;
            throw error;
        }

        return filtrarCamposTexto(portafolio);
    } catch (error) {
        console.error('Error en servicio actualizarTextosPortafolio:', error.message);
        throw error;
    }
};

/**
 * Filtra un portafolio para extraer únicamente los datos de texto y estilo visual relevantes.
 * 
 * @param {Object} portafolio - Objeto portafolio completo.
 * @returns {Object} Datos filtrados.
 */
const filtrarCamposTexto = (portafolio) => {
    const camposTexto = [
        'nombre_profesional',
        'profesion',
        'tipo_perfil',
        'zona_servicio',
        'descripcion_personal',
        'descripcion_detallada',
        'especialidades',
        'tono_pagina',
        'preferencia_estilo_usuario',
        'contenido_ia_titular',
        'contenido_ia_bio',
        'contenido_ia_servicios',
        'contenido_ia_especialidades',
        'contenido_ia_horarios',
        'telefono',
        'email_contacto',
        'ubicacion',
        'horarios',
        'whatsapp',
        'instagram',
        'facebook',
        'linkedin',
        'twitter',
        'tiktok',
        'youtube',
        'css_elegido',
        'carrusel_titulo',
        'meta_title',
        'meta_description'
    ];

    const filtrado = {};
    camposTexto.forEach(campo => {
        if (portafolio[campo] !== undefined) {
            filtrado[campo] = portafolio[campo];
        }
    });
    return filtrado;
};


/**
 * Añade imágenes nuevas (logo, portada o galería) al portafolio y gestiona el reemplazo/orden.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @param {Object} files - Objeto con los archivos cargados organizados por campo.
 * @returns {Promise<Array<Object>>} Detalles de las nuevas imágenes añadidas.
 */
export const añadirImagenesAPortafolio = async (id_portafolio, files) => {
    try {
        const imagenesAñadidas = [];

        if (!files || Object.keys(files).length === 0) {
            return imagenesAñadidas;
        }

        // Obtener todas las imágenes existentes UNA SOLA VEZ
        const imagenesExistentes = await imagenDao.obtenerImagenesPorPortafolio(id_portafolio);

        // VALIDACIÓN DE LÍMITE (UX)
        if (files.galeria && files.galeria.length > 0) {
            const limiteMaximo = 10;
            const cantidadActual = imagenesExistentes.filter(img => img.tipo === 'galeria').length;
            const cantidadNuevas = files.galeria.length;

            if (cantidadActual + cantidadNuevas > limiteMaximo) {
                // Limpieza de archivos huérfanos (Rollback físico)
                for (const archivos of Object.entries(files)) {
                    for (const archivo of archivos) {
                        if (archivo.path) {
                            eliminarArchivoFisico(archivo.path).catch(() => { });
                        }
                    }
                }

                const error = new Error(`Límite superado. El portafolio ya tiene ${cantidadActual} imágenes en la galería. Solo se pueden añadir ${limiteMaximo - cantidadActual} más.`);
                error.statusCode = 400;
                throw error;
            }
        }

        const promesasEliminacion = [];
        const listaImagenesParaInsertar = [];

        // PROCESAMIENTO DE IMÁGENES
        for (const [campo, archivos] of Object.entries(files)) {
            if (campo === 'logo' || campo === 'portada') {
                const imagenPrevia = imagenesExistentes.find(img => img.tipo === campo);

                if (imagenPrevia) {
                    // Añadimos a la lista de promesas para borrar en paralelo
                    promesasEliminacion.push(imagenDao.eliminarImagen(imagenPrevia.id_imagen));
                    promesasEliminacion.push(eliminarArchivoFisico(imagenPrevia.nombre_archivo));
                }

                const archivo = archivos[0];
                listaImagenesParaInsertar.push({
                    id_portafolio,
                    tipo: campo,
                    nombre_archivo: archivo.filename,
                    url_publica: `/imagenes/${archivo.filename}`,
                    mime_type: archivo.mimetype,
                    tamanio_bytes: archivo.size,
                    orden: 0
                });

            } else if (campo === 'galeria') {
                const maxOrden = await imagenDao.obtenerMaxOrdenPorPortafolioYTipo(id_portafolio, 'galeria');
                let ordenActual = maxOrden + 1;

                for (const archivo of archivos) {
                    listaImagenesParaInsertar.push({
                        id_portafolio,
                        tipo: 'galeria',
                        nombre_archivo: archivo.filename,
                        url_publica: `/imagenes/${archivo.filename}`,
                        mime_type: archivo.mimetype,
                        tamanio_bytes: archivo.size,
                        orden: ordenActual
                    });
                    ordenActual++;
                }
            }
        }

        // 1. Ejecutar eliminaciones previas de logo/portada en paralelo
        if (promesasEliminacion.length > 0) {
            await Promise.all(promesasEliminacion);
        }

        // 2. Realizar la inserción masiva de todas las nuevas imágenes en una única consulta
        if (listaImagenesParaInsertar.length > 0) {
            await imagenDao.insertarImagenesMasivo(listaImagenesParaInsertar);

            // Consultar las imágenes actualizadas del portafolio para mapear y devolver las añadidas
            const imagenesActuales = await imagenDao.obtenerImagenesPorPortafolio(id_portafolio);

            // Filtrar las imágenes actuales que coincidan con los nombres de archivo que acabamos de insertar
            const nombresArchivosNuevos = listaImagenesParaInsertar.map(img => img.nombre_archivo);
            const nuevasInsertadas = imagenesActuales.filter(img => nombresArchivosNuevos.includes(img.nombre_archivo));

            for (const img of nuevasInsertadas) {
                imagenesAñadidas.push({
                    id_imagen: img.id_imagen,
                    tipo: img.tipo,
                    url_publica: img.url_publica,
                    nombre_archivo: img.nombre_archivo,
                    orden: img.orden
                });
            }
        }

        return imagenesAñadidas;
    } catch (error) {
        console.error('Error en servicio añadirImagenesAPortafolio:', error.message);
        throw error;
    }
};

/**
 * Obtiene exclusivamente las rutas o URLs públicas de las imágenes actuales del portafolio.
 * 
 * @param {string} id_portafolio - ID del portafolio (UUID).
 * @returns {Promise<Object>} Objeto con las URLs de logo, portada y galería.
 */
export const obtenerRutasImagenesPortafolio = async (id_portafolio) => {
    try {
        const imagenes = await imagenDao.obtenerImagenesPorPortafolio(id_portafolio);

        const rutas = {
            logo: null,
            portada: null,
            galeria: []
        };

        for (const img of imagenes) {
            if (img.tipo === 'logo') {
                rutas.logo = img.url_publica;
            } else if (img.tipo === 'portada') {
                rutas.portada = img.url_publica;
            } else if (img.tipo === 'galeria') {
                rutas.galeria.push(img.url_publica);
            }
        }

        return rutas;
    } catch (error) {
        console.error('Error en servicio obtenerRutasImagenesPortafolio:', error.message);
        throw error;
    }
};


