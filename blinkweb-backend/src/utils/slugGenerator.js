/**
 * Genera un slug base a partir de un texto.
 * Pasa a minúsculas, elimina tildes/caracteres especiales y cambia los espacios por guiones.
 * 
 * @param {string} texto - El texto original para generar el slug.
 * @returns {string} El slug base generado.
 */
export const generarSlugBase = (texto) => {
    if (!texto || typeof texto !== 'string') return '';
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};
