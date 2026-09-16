import fs from 'fs/promises'; // Se usa para manipular archivos de forma asíncrona
import path from 'path'; // Se usa para trabajar con rutas de archivos

const UPLOAD_DIR = path.join(process.cwd(), '../blinkweb-imagenes'); // Ruta de la carpeta de imágenes

/**
 * Elimina de manera segura un archivo físico en la carpeta de almacenamiento de imágenes.
 * 
 * @param {string} nombreArchivo - Nombre del archivo a eliminar.
 * @returns {Promise<boolean>} Devuelve true si se borró con éxito, false en caso contrario.
 */
export const eliminarArchivoFisico = async (nombreArchivo) => {
    if (!nombreArchivo) return false;

    // Sanitización estricta contra Path Traversal
    const basename = path.basename(nombreArchivo);
    const rutaAbsoluta = path.join(UPLOAD_DIR, basename);

    try {
        await fs.unlink(rutaAbsoluta); // Elimina el archivo físico de la carpeta de imágenes
        console.log(`[FileHelper] Archivo físico eliminado correctamente: ${rutaAbsoluta}`);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.warn(`[FileHelper] El archivo no existía en disco (ya limpio): ${rutaAbsoluta}`);
            return true; // Consideramos éxito porque el archivo no está en el disco
        } else {
            console.error(`[FileHelper] Error al eliminar físicamente el archivo ${nombreArchivo}:`, err.message);
            return false;
        }
    }
};
