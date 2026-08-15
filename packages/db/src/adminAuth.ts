import type { DatabaseSync } from "node:sqlite";
import { db } from "./db.js";

export interface AdminSession {
    tokenHash: string;
    createdAt: number;
    expiresAt: number;
}

export class AdminAuthStore {
    public constructor(private readonly database: DatabaseSync = db) {
        this.database.exec(`
            CREATE TABLE IF NOT EXISTS admin_account (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS admin_sessions (
                token_hash TEXT PRIMARY KEY,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL
            );
        `);
    }

    public hasAdminAccount(): boolean {
        const row = this.database
            .prepare("SELECT 1 AS present FROM admin_account WHERE id = 1")
            .get();
        return Boolean(row);
    }

    public createAdminAccount(passwordHash: string, now = Date.now()): boolean {
        const result = this.database
            .prepare(
                `INSERT OR IGNORE INTO admin_account (id, password_hash, created_at, updated_at)
                 VALUES (1, ?, ?, ?)`,
            )
            .run(passwordHash, now, now);

        return Number(result.changes ?? 0) > 0;
    }

    public getPasswordHash(): string | null {
        const row = this.database
            .prepare("SELECT password_hash FROM admin_account WHERE id = 1")
            .get() as { password_hash?: string } | undefined;

        return row?.password_hash ?? null;
    }

    public createSession(tokenHash: string, createdAt: number, expiresAt: number): void {
        this.database
            .prepare(
                `INSERT INTO admin_sessions (token_hash, created_at, expires_at)
                 VALUES (?, ?, ?)`,
            )
            .run(tokenHash, createdAt, expiresAt);
    }

    public getSession(tokenHash: string, now = Date.now()): AdminSession | null {
        this.database.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").run(now);

        const row = this.database
            .prepare(
                `SELECT token_hash, created_at, expires_at
                 FROM admin_sessions
                 WHERE token_hash = ? AND expires_at > ?`,
            )
            .get(tokenHash, now) as
            { token_hash?: string; created_at?: number; expires_at?: number } | undefined;

        if (!row) return null;

        return {
            tokenHash: String(row.token_hash),
            createdAt: Number(row.created_at),
            expiresAt: Number(row.expires_at),
        };
    }

    public deleteSession(tokenHash: string): boolean {
        const result = this.database
            .prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
            .run(tokenHash);
        return Number(result.changes ?? 0) > 0;
    }
}

export const adminAuthStore = new AdminAuthStore();
