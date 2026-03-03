// src/lib/db.ts
import mysql from "mysql2/promise";

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // optional but helpful:
    // dateStrings: true,
});