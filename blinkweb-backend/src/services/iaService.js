import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Inicialización del cliente de Google AI con la clave de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


/**
 * Genera el contenido SEO, comercial y diseño para un portafolio utilizando la IA de Google Gemini.
 * 
 * @param {Object} portafolio - Objeto con la información básica del portafolio.
 * @param {string} portafolio.nombre_profesional - Nombre del profesional.
 * @param {string} portafolio.profesion - Profesión del profesional.
 * @param {string} portafolio.tipo_perfil - Tipo de perfil ('particular' o 'empresa').
 * @param {string} portafolio.descripcion_personal - Breve descripción personal.
 * @param {string} portafolio.descripcion_detallada - Descripción profesional detallada.
 * @param {string} portafolio.especialidades - Especialidades del profesional.
 * @param {string} portafolio.horarios - Horarios de atención.
 * @param {string} portafolio.tono_pagina - Tono deseado para la redacción de la página.
 * @param {string} portafolio.preferencia_estilo_usuario - Preferencia de estilo visual del usuario.
 * @returns {Promise<Object>} El contenido generado estructurado (meta_title, meta_description, titular, bio, servicios, especialidades, horarios, css_elegido).
 */
export const generarContenidoPortafolio = async (portafolio) => {
  try {
    const prompt = `
    Actúa como un experto en copywriting, SEO y diseño web. Tu objetivo es crear el contenido para la página web (portafolio) de un profesional y seleccionar la hoja de estilos más adecuada.
  
    DATOS DEL PROFESIONAL:
    - Nombre: ${portafolio.nombre_profesional}
    - Profesión: ${portafolio.profesion}
    - Tipo de perfil: ${portafolio.tipo_perfil || 'particular'}
    - Descripción personal: ${portafolio.descripcion_personal}
    - Descripción profesional: ${portafolio.descripcion_detallada}
    - Especialidades: ${portafolio.especialidades}
    - Horarios: ${portafolio.horarios}
    - Tono deseado: ${portafolio.tono_pagina}
    - Preferencia de estilo del usuario: ${portafolio.preferencia_estilo_usuario || 'No especificado'}
  
    INSTRUCCIONES DE DISEÑO:
    Para el campo css_elegido, debes analizar la profesión, el tono y la vibra del usuario, y devolver obligatoriamente un número entero del 1 al 8. Aplica esta guía de estilos:

    Mineral (1 Claro, 5 Oscuro): Minimalista, corporativo, precisión suiza, bordes suaves. Ideal para: Abogados, consultores, financieros, ejecutivos.

    Editorial (2 Claro, 6 Oscuro): Estilo revista, audaz, estructurado, sin bordes redondeados. Ideal para: Periodistas, escritores, fotógrafos, modelos, moda.

    Glass (3 Claro, 7 Oscuro): Tecnológico, moderno, translúcido (glassmorphism), bordes muy redondeados. Ideal para: Desarrolladores de software, diseñadores UX/UI, ingenieros IT, startups.

    Warm (4 Claro, 8 Oscuro): Orgánico, acogedor, asimétrico, muy redondeado. Ideal para: Psicólogos, artistas, ilustradores, educadores, terapeutas.

    Nota: Si el usuario no especifica preferencia por claro u oscuro, deduce la mejor opción según su sector (ej. perfiles tecnológicos suelen usar oscuro, perfiles corporativos clásicos usan claro).

    INSTRUCCIONES DE SALIDA Y LÍMITES ESTRICTOS:
    Debes devolver EXCLUSIVAMENTE un objeto JSON válido con las siguientes claves exactas. 
    Es CRÍTICO que respetes los límites de longitud de caracteres marcados para evitar errores en el sistema. Sé conciso.
  
    {
    "meta_title": "Título SEO corto. REGLA ESTRICTA: MÁXIMO 50 CARACTERES.",
    "meta_description": "Descripción SEO persuasiva. REGLA ESTRICTA: MÁXIMO 140 CARACTERES.",
    "contenido_ia_titular": "Titular H1 impactante y comercial. REGLA ESTRICTA: MÁXIMO 100 CARACTERES.",
    "contenido_ia_bio": "Biografía atractiva basada en la descripción aportada, estructurada en 2 o 3 párrafos HTML (<p>).",
    "contenido_ia_servicios": "Listado de servicios redactado de forma persuasiva, estructurado en una lista HTML (<ul><li>).",
    "contenido_ia_especialidades": "Especialidades redactadas de forma atractiva basadas en las especialidades del profesional, estructuradas en texto o lista HTML simple.",
    "contenido_ia_horarios": "Texto natural sobre horarios generado por IA a partir de la información de horarios. REGLA ESTRICTA: MÁXIMO 250 CARACTERES.",
    "css_elegido": "Número entero (del 1 al 8) según la regla de las INSTRUCCIONES DE DISEÑO."
    }
`;
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });


    const resultado = await model.generateContent(prompt);
    const textoRespuesta = resultado.response.text();

    // Convertimos el string de texto a un objeto JavaScript real
    const datosGenerados = JSON.parse(textoRespuesta);

    // Límite BD: VARCHAR(100)
    if (datosGenerados.contenido_ia_titular && datosGenerados.contenido_ia_titular.length > 100) {
      datosGenerados.contenido_ia_titular = datosGenerados.contenido_ia_titular.substring(0, 97) + '...';
    }

    // Límite BD: VARCHAR(60)
    if (datosGenerados.meta_title && datosGenerados.meta_title.length > 60) {
      datosGenerados.meta_title = datosGenerados.meta_title.substring(0, 57) + '...';
    }

    // Límite BD: VARCHAR(160)
    if (datosGenerados.meta_description && datosGenerados.meta_description.length > 160) {
      datosGenerados.meta_description = datosGenerados.meta_description.substring(0, 157) + '...';
    }

    // Límite BD: VARCHAR(255)
    if (datosGenerados.contenido_ia_horarios && datosGenerados.contenido_ia_horarios.length > 255) {
      datosGenerados.contenido_ia_horarios = datosGenerados.contenido_ia_horarios.substring(0, 252) + '...';
    }


    // Convertir y validar css_elegido para asegurar que sea un entero del 1 al 8
    let cssElegido = parseInt(datosGenerados.css_elegido, 10);
    if (isNaN(cssElegido) || ![1, 2, 3, 4, 5, 6, 7, 8].includes(cssElegido)) {
      cssElegido = 1; // Valor por defecto si la IA alucina texto
    }
    datosGenerados.css_elegido = cssElegido;

    return datosGenerados;

  } catch (error) {
    console.error('Error en servicio generarContenidoPortafolio:', error.message);
    throw error;
  }
};
