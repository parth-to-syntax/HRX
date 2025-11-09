import express from 'express';
import cors from 'cors';
import { pool, initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import salaryRoutes from './routes/salary.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leave.js';
import payrollRoutes from './routes/payroll.js';
import adminRoutes from './routes/admin.js';
import faceRoutes from './routes/face.js';
import cacheRoutes from './routes/cache.js';
import uploadRoutes from './routes/upload.js';
import { initCronJobs } from './services/cronService.js';

const app = express();
// Allow credentials for cookie-based auth; configure origin via env (comma-separated)
const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true;
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
// If behind a proxy (e.g., Render/Railway), enable trust proxy for secure cookies when you set secure: true
// app.set('trust proxy', 1);
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/salary', salaryRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/leaves', leaveRoutes);
app.use('/payroll', payrollRoutes);
app.use('/admin', adminRoutes);
app.use('/face', faceRoutes);
app.use('/cache', cacheRoutes);
app.use('/upload', uploadRoutes);

// Serve static files (avatars, uploads)
app.use('/avatars', express.static('public/avatars'));

// Automated daily absence marking (runs once on startup and then every hour)
async function markPreviousDayAbsents() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0,10);
    // Employees without attendance row and without approved leave covering yesterday
    const empQ = await pool.query(
      `SELECT e.id
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id=e.id AND a.date=$1
         LEFT JOIN leave_requests lr ON lr.employee_id=e.id AND lr.status='approved' AND lr.start_date <= $1 AND lr.end_date >= $1
        WHERE a.id IS NULL AND lr.id IS NULL`,
      [dateStr]
    );
    let inserted = 0;
    for (const r of empQ.rows) {
      await pool.query("INSERT INTO attendance (employee_id, date, status, work_hours, break_hours, extra_hours) VALUES ($1,$2,'absent',0,0,0) ON CONFLICT (employee_id, date) DO NOTHING", [r.id, dateStr]);
      inserted++;
    }
    if (inserted) console.log(`Auto absent marking: ${inserted} employees marked absent for ${dateStr}`);
  } catch (e) {
    console.error('Auto absent marking error:', e.message);
  }
}

// Run once after startup (delay to ensure pool is ready) then schedule hourly
setTimeout(markPreviousDayAbsents, 5000);
setInterval(markPreviousDayAbsents, 60 * 60 * 1000);

// best-effort one-time DB init on startup (safe; schema uses IF NOT EXISTS)
(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set; skipping DB initialization.');
    return;
  }
  try {
    await initDatabase();
    console.log('Database initialized.');
    
    // Initialize cron jobs for automated tasks (e.g., monthly payslip emails)
    initCronJobs();
    console.log('Cron jobs initialized.');
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

