import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db.js';
import { sendMail, isEmailConfigured } from '../utils/email.js';
import { generateLoginId } from '../utils/loginId.js';

const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function setAuthCookie(res, token) {
  // httpOnly cookie; in production add secure and sameSite settings
  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // set true behind HTTPS proxy
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function registerEmployee(req, res) {
  // Accessible by admin/hr only (enforced by route middleware)
  try {
    const { first_name, last_name, email, role = 'employee', company_id, date_of_joining } = req.body;
    if (!company_id || !date_of_joining) {
      return res.status(400).json({ error: 'company_id and date_of_joining are required' });
    }

    // Start a transaction to safely generate a new joining_serial per year
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const year = new Date(date_of_joining).getFullYear();

      // Lock the row for the year to avoid race conditions; create if missing
      // Upsert pattern: try update; if no row, insert then update again
      const upsertCounter = `
        INSERT INTO joining_counters (year, current_serial)
        VALUES ($1, 0)
        ON CONFLICT (year) DO NOTHING
      `;
      await client.query(upsertCounter, [year]);

      // Increment and fetch the new serial atomically
      const { rows: counterRows } = await client.query(
        'UPDATE joining_counters SET current_serial = current_serial + 1, updated_at = NOW() WHERE year = $1 RETURNING current_serial',
        [year]
      );
      const joining_serial = counterRows[0].current_serial;

      const login_id = generateLoginId(first_name, last_name, date_of_joining, joining_serial);
      const tempPassword = crypto.randomBytes(6).toString('hex');
      const password_hash = await bcrypt.hash(tempPassword, rounds);

      const userInsert = `INSERT INTO users (login_id, password_hash, role, company_id) VALUES ($1,$2,$3,$4) RETURNING id, role, company_id`;
      const userResult = await client.query(userInsert, [login_id, password_hash, role, company_id]);
      const userId = userResult.rows[0].id;

      const empInsert = `INSERT INTO employees (user_id, company_id, first_name, last_name, email, date_of_joining, joining_serial) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`;
      await client.query(empInsert, [userId, company_id, first_name, last_name, email, date_of_joining, joining_serial]);

      await client.query('COMMIT');

      // Return temp password for MVP (normally email it)
      res.status(201).json({ login_id, temp_password: tempPassword });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed', detail: e.message });
  }
}

export async function login(req, res) {
  try {
    const { login_id, password } = req.body;
    if (!login_id || !password) return res.status(400).json({ error: 'login_id and password required' });
    const { rows } = await pool.query('SELECT * FROM users WHERE login_id=$1', [login_id]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // first login must reset password
    if (user.is_first_login) {
      return res.status(428).json({ error: 'Password reset required', first_login: true });
    }
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ role: user.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function resetFirstPassword(req, res) {
  try {
    const { login_id, temp_password, new_password } = req.body;
    if (!login_id || !temp_password || !new_password) return res.status(400).json({ error: 'login_id, temp_password, new_password required' });
    const { rows } = await pool.query('SELECT * FROM users WHERE login_id=$1', [login_id]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid login_id' });
    const user = rows[0];
    if (!user.is_first_login) return res.status(400).json({ error: 'Already reset' });

    const match = await bcrypt.compare(temp_password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid temp password' });

    const newHash = await bcrypt.hash(new_password, rounds);
    await pool.query('UPDATE users SET password_hash=$1, is_first_login=false WHERE id=$2', [newHash, user.id]);
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ message: 'Password set' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Reset failed' });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { login_id } = req.body;
    if (!login_id) return res.status(400).json({ error: 'login_id required' });
    const { rows } = await pool.query('SELECT id, login_id FROM users WHERE login_id=$1', [login_id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)', [user.id, token, expires]);

    if (isEmailConfigured()) {
      try {
        await sendMail({
          to: process.env.RESET_TEST_EMAIL || rows[0].login_id + '@example.local',
          subject: 'Password Reset',
          text: `Use this token to reset your password: ${token}`,
        });
      } catch (mailErr) {
        console.warn('Email send failed', mailErr.message);
      }
    }

    res.json({ message: 'Reset token issued', token }); // Include token for MVP debugging
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Forgot password failed' });
  }
}

export async function applyPasswordReset(req, res) {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'token and new_password required' });
    const { rows } = await pool.query('SELECT * FROM password_resets WHERE token=$1', [token]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid token' });
    const pr = rows[0];
    if (pr.used_at) return res.status(400).json({ error: 'Token already used' });
    if (new Date(pr.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });

    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id=$1', [pr.user_id]);
    if (!userRows.length) return res.status(404).json({ error: 'User not found' });
    const user = userRows[0];

    const newHash = await bcrypt.hash(new_password, rounds);
    await pool.query('UPDATE users SET password_hash=$1, is_first_login=false WHERE id=$2', [newHash, user.id]);
    await pool.query('UPDATE password_resets SET used_at=NOW() WHERE id=$1', [pr.id]);
  const jwtToken = signToken(user);
  setAuthCookie(res, jwtToken);
  res.json({ message: 'Password updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Password reset failed' });
  }
}
