import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Comprobación inmediata de la conexión al arrancar
try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión establecida correctamente con MySQL (tfm_portfolio_db).');
    connection.release();
} catch (error) {
    console.error('❌ Error crítico en la conexión a la base de datos:', error.message);
}

export default pool;