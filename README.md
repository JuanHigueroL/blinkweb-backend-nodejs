# BlinkWeb — Backend

Backend de **BlinkWeb**, una aplicación web desarrollada como **Trabajo de Fin de Máster (TFM)** del Máster Universitario en Desarrollo Ágil de Software para la Web.

BlinkWeb permite generar portfolios profesionales mediante **Inteligencia Artificial**, utilizando la API de **Google Gemini** para generar y estructurar contenido a partir de las preferencias y datos proporcionados por el usuario.

Este repositorio contiene exclusivamente el **backend** de la aplicación, encargado de la lógica de negocio, procesamiento de datos, autenticación, persistencia y comunicación con los servicios externos.

---

## ✨ Características principales

### 🤖 Integración con Inteligencia Artificial

Integración con la **API de Google Gemini** para generar contenido personalizado para portfolios profesionales a partir de los datos proporcionados por el usuario.

### 🔍 Validación y procesamiento de prompts

Pipeline encargado de:

* Validar los datos recibidos.
* Estructurar la información antes de enviarla al modelo.
* Procesar la respuesta generada por Gemini.
* Validar el resultado obtenido.
* Garantizar que la respuesta cumple con el formato esperado.

### 🔐 Autenticación y seguridad

Implementación de autenticación mediante **JSON Web Tokens (JWT)** para proteger los endpoints y controlar el acceso a los recursos de la API.

### 🌐 API REST

API REST desarrollada con **Node.js y Express.js** para gestionar la comunicación entre el frontend y el backend.

### 🗄️ Persistencia de datos

Base de datos relacional **MySQL** utilizada para almacenar información de usuarios, configuraciones y portfolios generados.

---

## 🛠️ Stack tecnológico

| Tecnología            | Uso                                 |
| --------------------- | ----------------------------------- |
| **Node.js**           | Entorno de ejecución                |
| **Express.js**        | Framework backend                   |
| **MySQL**             | Base de datos relacional            |
| **JWT**               | Autenticación                       |
| **Google Gemini API** | Generación de contenido mediante IA |
| **JavaScript**        | Lenguaje principal                  |

---

## 🏗️ Arquitectura y flujo de trabajo

El flujo principal de generación de un portfolio es el siguiente:

```text
┌──────────────┐
│   Frontend   │
│    React     │
└──────┬───────┘
       │
       │ Datos + preferencias
       ▼
┌──────────────────────┐
│      Backend         │
│   Node.js / Express  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Autenticación JWT    │
│ y validación datos   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Pipeline de prompts  │
│ Validación y formato │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Google Gemini API  │
└──────────┬───────────┘
           │
           │ Respuesta generada
           ▼
┌──────────────────────┐
│ Validación respuesta │
│      JSON            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    MySQL Database    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Portfolio estructurado│
│        (JSON)        │
└──────────────────────┘
```

### Flujo resumido

1. El cliente React envía los datos del usuario y sus preferencias al backend.
2. El backend verifica el token JWT y valida la información recibida.
3. Los datos se procesan mediante el pipeline de validación y preparación del prompt.
4. El backend realiza una petición a la API de Google Gemini.
5. La respuesta generada se valida y estructura según el formato esperado.
6. Los datos resultantes se almacenan en MySQL.
7. El backend devuelve el portfolio estructurado en formato JSON al cliente.

---

## 🚀 Instalación y configuración

### Requisitos previos

Para ejecutar el proyecto localmente es necesario disponer de:

* **Node.js**
* **npm**
* **MySQL**
* Una **API Key de Google Gemini**

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DE_LA_CARPETA>
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar las variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña_mysql
DB_NAME=tfm_portfolio_db
DB_PORT=3306

# Google Gemini
GEMINI_API_KEY=tu_clave_de_api_de_google_gemini

# JWT
JWT_SECRET=tu_secreto_para_jwt
```

> ⚠️ **Importante:** no subas el archivo `.env` al repositorio. Añádelo a `.gitignore` para evitar exponer credenciales o claves privadas.

### 4. Inicializar la base de datos

Ejecutar las migraciones o scripts de inicialización incluidos en el proyecto, si corresponde.

### 5. Iniciar el servidor

Para iniciar el proyecto en modo desarrollo:

```bash
npm run dev
```

El servidor estará disponible en:

```text
http://localhost:3000
```

---

## 📁 Estructura del proyecto

La estructura puede variar según la versión actual del proyecto. De forma general:

```text
src/
├── controllers/
├── routes/
├── services/
├── models/
├── middleware/
├── config/
└── ...
```

Cada módulo se encarga de una responsabilidad concreta dentro de la aplicación, separando la gestión de rutas, lógica de negocio, persistencia y middleware.

---

## 🎓 Contexto académico

**BlinkWeb** fue desarrollado como parte del **Trabajo de Fin de Máster** del:

**Máster Universitario en Desarrollo Ágil de Software para la Web**
Universidad de Alcalá · 2025–2026

El objetivo del proyecto es explorar la utilización de modelos de Inteligencia Artificial generativa para automatizar la creación y estructuración de contenido destinado a portfolios profesionales.

---

## 👤 Autor

**Juan Higuero López**

* GitHub: [JuanHigueroL](https://github.com/JuanHigueroL)
