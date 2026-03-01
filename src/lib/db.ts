import mysql from "mysql2/promise";

declare global {
    var _dbPool: mysql.Pool | undefined;
}

export function getPool() {
    if (!global._dbPool) {
        global._dbPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT ?? 3306),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }
    return global._dbPool;
}