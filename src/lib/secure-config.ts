// src/lib/secure-config.ts
import "server-only";
import { db } from "@/lib/db";

type ConfigRow = {
    config_value: string | null;
    value_type: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let authSecretCache:
    | {
    value: string;
    expiresAt: number;
}
    | null = null;

async function getConfigValue(configKey: string): Promise<string | null> {
    const [rows] = await db.query(
        `
            SELECT config_value, value_type
            FROM sys_config
            WHERE config_key = ?
            LIMIT 1
        `,
        [configKey]
    );

    const typedRows = rows as ConfigRow[];
    if (!typedRows.length) return null;

    return typedRows[0].config_value ?? null;
}

export async function getAuthSecretFromDb(): Promise<string> {
    const now = Date.now();

    if (authSecretCache && authSecretCache.expiresAt > now) {
        return authSecretCache.value;
    }

    const secret = await getConfigValue("auth.jwt_secret");

    if (!secret) {
        throw new Error("auth.jwt_secret is missing from sys_config");
    }

    authSecretCache = {
        value: secret,
        expiresAt: now + CACHE_TTL_MS,
    };

    return secret;
}