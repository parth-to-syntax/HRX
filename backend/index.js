import express from 'express';
import cors from 'cors';
import { pool, initDatabase } from './db.js';
import authRoutes from './routes/auth.js';

const app = express();
// Allow credentials for cookie-based auth; configure origin via env (comma-separated)
const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true;
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
// If behind a proxy (e.g., Render/Railway), enable trust proxy for secure cookies when you set secure: true
// app.set('trust proxy', 1);
app.use('/auth', authRoutes);

// best-effort one-time DB init on startup (safe; schema uses IF NOT EXISTS)
(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set; skipping DB initialization.');
    return;
  }
  try {
    await initDatabase();
    console.log('Database initialized.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
})();

app.get('/health', async (_req, res) => {
	try {
		await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
	} catch (e) {
		res.status(500).json({ ok: false, error: e.message });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`API listening on http://localhost:${PORT}`);
});

