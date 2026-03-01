import mysql from "mysql2/promise";

declare global {
    // eslint-disable-next-line no-var
    var __plannerPool: mysql.Pool | undefined;
}

export function getPool() {
    if (!global.__plannerPool) {
        global.__plannerPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
        });
    }
    return global.__plannerPool;
}