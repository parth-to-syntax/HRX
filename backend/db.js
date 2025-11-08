// Database configuration and initializer for WorkZen backend (ESM)
import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Set it in .env before starting the server.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error:', err.message);
});

async function ensureConnection() {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (err) {
    // Sanitize connection string (remove password) for debug
    const cs = (process.env.DATABASE_URL || '').replace(/:(.*)@/, ':****@');
    console.error('DB connection failed:', err.message, 'CS:', cs);
    throw err;
  }
}

// Initialize database by executing schema.sql (idempotent: uses IF NOT EXISTS)
export async function initDatabase() {
  await ensureConnection();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');

  // Single multi-statement execution. Ensure your user has permission for CREATE EXTENSION.
  try {
    await pool.query(sql);
  } catch (err) {
    console.error('Schema execution error:', err.message);
    throw err;
  }
}

// Run SQL migrations from the migrations directory (in filename order)
export async function runMigrations() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsDir = path.join(__dirname, 'migrations');
  try {
    const entries = await fs.readdir(migrationsDir);
    const files = entries
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const p = path.join(migrationsDir, file);
      const sql = await fs.readFile(p, 'utf8');
      if (!sql.trim()) continue;
      try {
        await pool.query(sql);
        console.log(`Applied migration: ${file}`);
      } catch (err) {
        // If migration is idempotent (IF NOT EXISTS), errors mean real issues
        console.error(`Migration failed (${file}):`, err.message);
        throw err;
      }
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      // no migrations directory; ignore
      return;
    }
    throw e;
  }
}

export { pool };
