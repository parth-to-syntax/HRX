// Seed an initial company and admin user.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import crypto from 'crypto';

async function main() {
  const companyName = process.env.SEED_COMPANY_NAME || 'Demo Company';
  const adminLoginId = process.env.SEED_ADMIN_LOGIN || 'OIADMI000000';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(6).toString('hex');
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

  try {
    const { rows: crows } = await pool.query(
      'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [companyName]
    );
    const companyId = crows[0].id;

    const hash = await bcrypt.hash(adminPassword, rounds);
    const { rows: urows } = await pool.query(
      `INSERT INTO users (login_id, password_hash, role, company_id, is_first_login)
       VALUES ($1,$2,'admin',$3,false)
       ON CONFLICT (login_id) DO UPDATE SET role='admin' RETURNING id`,
      [adminLoginId, hash, companyId]
    );

    console.log('Seeded Admin');
    console.log('Company:', companyName, companyId);
    console.log('Admin Login ID:', adminLoginId);
    console.log('Admin Password:', adminPassword);
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exit(1);
  }
}

main();
