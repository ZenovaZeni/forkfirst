import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbDir = path.join(process.cwd(), ".forkfirst");
const dbPath = path.join(dbDir, "forkfirst.sqlite");
const legacyDbDir = path.join(process.cwd(), ".open-repo");
const legacyDbPath = path.join(legacyDbDir, "open-repo.sqlite");

let db: Database.Database | null = null;

function migrateLegacyDbIfNeeded(): void {
  if (fs.existsSync(dbPath) || !fs.existsSync(legacyDbPath)) return;
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  fs.copyFileSync(legacyDbPath, dbPath);
}

export function getDb(): Database.Database {
  migrateLegacyDbIfNeeded();
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!db) {
    const connection = new Database(dbPath);
    connection.exec(`
      CREATE TABLE IF NOT EXISTS research_cases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS idea_checks (
        id TEXT PRIMARY KEY,
        case_id TEXT,
        prompt TEXT NOT NULL,
        verdict TEXT NOT NULL,
        summary TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS saved_repos (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        payload TEXT NOT NULL,
        saved_at TEXT NOT NULL
      );
    `);
    db = connection;
  }
  return db;
}
