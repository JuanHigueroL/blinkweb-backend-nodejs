-- ============================================================================
-- SCRIPT SQL - HITO 1: PLATAFORMA INTELIGENTE DE GENERACIÓN ÁGIL DE PORTAFOLIOS
-- Nombre de la plataforma: ClickWeb
-- CONTENIDO: Solo Tablas Base (Estructura Relacional Limpia)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `tfm_portfolio_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `tfm_portfolio_db`;

-- ============================================================================
-- TABLA 1: USUARIOS
-- ============================================================================
CREATE TABLE `usuarios` (
  `id_usuario` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email del usuario para login',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Contraseña encriptada con bcrypt',
  `nombre_cuenta` VARCHAR(100) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_email` (`email`),
  INDEX `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 2: PORTAFOLIOS
-- ============================================================================
CREATE TABLE `portafolios` (
  `id_portafolio` CHAR(36) PRIMARY KEY,
  `id_usuario` INT UNSIGNED NOT NULL,
  
  -- Identidad y Configuración (Formulario Sección 1)
  `nombre_profesional` VARCHAR(150) NOT NULL,
  `profesion` VARCHAR(100) NOT NULL,
  `tipo_perfil` ENUM('particular', 'empresa') NOT NULL DEFAULT 'particular',
  `zona_servicio` VARCHAR(200),
  `slug` VARCHAR(100) UNIQUE COMMENT 'URL personalizada. NULL hasta que se decida publicar',
  `activa` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Control de estado: borrador o pública',
  
  -- Inputs para la IA (Formulario Sección 2)
  `descripcion_personal` TEXT,
  `descripcion_detallada` TEXT,
  `especialidades` TEXT,
  `tono_pagina` ENUM('formal', 'coloquial') NOT NULL DEFAULT 'formal',
  `preferencia_estilo_usuario` TEXT,

  -- Contenido Generado por IA (Incluye Titular para evitar inconsistencias)
  `contenido_ia_titular` VARCHAR(255) COMMENT 'H1 fluido generado por Gemini',
  `contenido_ia_bio` LONGTEXT COMMENT 'Biografía redactada por Gemini',
  `contenido_ia_servicios` LONGTEXT COMMENT 'Servicios redactados por Gemini',
  `contenido_ia_especialidades` TEXT COMMENT 'Especialidades redactadas por Gemini',
  `contenido_ia_horarios` VARCHAR(255) COMMENT 'Texto natural sobre horarios generado por IA',
  
  -- Contacto y Ubicación (Formulario Sección 4)
  `telefono` VARCHAR(20),
  `email_contacto` VARCHAR(255),
  `ubicacion` VARCHAR(300),
  `horarios` TEXT COMMENT 'Texto o estructura JSON para horarios',
  
  -- Redes Sociales (Formulario Sección 5)
  `whatsapp` VARCHAR(20),
  `instagram` VARCHAR(100),
  `facebook` VARCHAR(100),
  `linkedin` VARCHAR(100),
  `twitter` VARCHAR(100),
  `tiktok` VARCHAR(100),
  `youtube` VARCHAR(100),
  
  -- Estilo Visual (Formulario Sección 6)
  `css_elegido` TINYINT UNSIGNED DEFAULT 1 COMMENT '1: Clara/Plana, 2: Clara/Llamativa, 3: Oscura/Plana, 4: Oscura/Llamativa',
  `carrusel_titulo` VARCHAR(100) DEFAULT 'Galería' COMMENT 'Título personalizado para la sección de imágenes',
  
  -- SEO (Formulario Sección 7)
  `meta_title` VARCHAR(60),
  `meta_description` VARCHAR(160),
  
  -- Control
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultima_publicacion` TIMESTAMP NULL,
  
  -- Relaciones (Corregido sin comentarios internos)
  FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Índices de optimización
  INDEX `idx_id_usuario` (`id_usuario`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_activa` (`activa`),
  UNIQUE INDEX `idx_usuario_slug` (`id_usuario`, `slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA 3: IMAGENES
-- ============================================================================
CREATE TABLE `imagenes` (
  `id_imagen` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `id_portafolio` CHAR(36) NOT NULL,
  
  `tipo` ENUM('logo', 'portada', 'galeria') NOT NULL COMMENT 'Diferencia el uso de la imagen',
  `nombre_archivo` VARCHAR(255) NOT NULL,
  `url_publica` VARCHAR(500) NOT NULL COMMENT 'Ruta de acceso en el servidor de Node.js',
  
  -- Metadatos del archivo
  `mime_type` VARCHAR(50),
  `tamanio_bytes` INT UNSIGNED,
  
  -- Control de orden
  `orden` INT UNSIGNED DEFAULT 0 COMMENT 'Para organizar las fotos de la galería',
  `activa` BOOLEAN NOT NULL DEFAULT TRUE,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relaciones (Corregido)
  FOREIGN KEY (`id_portafolio`) REFERENCES `portafolios`(`id_portafolio`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  
  -- Índices
  INDEX `idx_id_portafolio` (`id_portafolio`),
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_orden` (`id_portafolio`, `orden`),
  INDEX `idx_id_tipo` (`id_portafolio`, `tipo`),
  UNIQUE INDEX `idx_nombre_archivo_unico` (`nombre_archivo`),
  UNIQUE INDEX `idx_url_publica_unica` (`url_publica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
