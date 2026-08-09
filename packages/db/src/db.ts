import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'srouter.db');

// Ensure parent folder exists if path contains subdirectories
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize database schema tables if they do not exist
 */
export function initDatabase(): void {
    // 1. Table for Providers configuration
    db.exec(`
        CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            protocol TEXT NOT NULL,
            base_url TEXT,
            api_key TEXT,
            access_token TEXT,
            custom_headers TEXT,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL
        );
    `);

    // 2. Table for Client API Keys / Endpoint Keys
    db.exec(`
        CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            rate_limit INTEGER DEFAULT 0,
            quota_limit INTEGER DEFAULT 0,
            usage_tokens INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL
        );
    `);

    // 3. Table for Request Logs & Token Analytics
    db.exec(`
        CREATE TABLE IF NOT EXISTS request_logs (
            id TEXT PRIMARY KEY,
            api_key_id TEXT,
            provider_id TEXT NOT NULL,
            model TEXT NOT NULL,
            prompt_tokens INTEGER NOT NULL DEFAULT 0,
            completion_tokens INTEGER NOT NULL DEFAULT 0,
            total_tokens INTEGER NOT NULL DEFAULT 0,
            status_code INTEGER NOT NULL,
            latency_ms INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
    `);
}

// Auto-run schema initialization
initDatabase();
