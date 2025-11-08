import { pool } from '../db.js';

const DEFAULT_EXPECTED_DAILY_HOURS = Number(process.env.EXPECTED_DAILY_HOURS || 8);

async function getEmployeeByUser(userId) {
  const { rows } = await pool.query('SELECT id, company_id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
  return rows.length ? rows[0] : null;
}

function toDateOnly(d) {
  // expects YYYY-MM-DD or Date; returns YYYY-MM-DD
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

function hoursBetween(start, end, breakHours = 0) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hrs = ms / 36e5 - Number(breakHours || 0);
  return Math.max(0, Math.round(hrs * 100) / 100);
}

export async function checkInMe(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    // Upsert today's attendance using DB current date
    const existing = await pool.query(
      'SELECT id, check_in FROM attendance WHERE employee_id=$1 AND date = CURRENT_DATE',
      [emp.id]
    );
    if (existing.rowCount && existing.rows[0].check_in) {
      // idempotent: already checked in
      const { rows } = await pool.query('SELECT * FROM attendance WHERE id=$1', [existing.rows[0].id]);
      return res.json(rows[0]);
    }
    if (existing.rowCount) {
      const { rows } = await pool.query(
        "UPDATE attendance SET check_in = NOW(), status = COALESCE(status, 'present') WHERE id=$1 RETURNING *",
        [existing.rows[0].id]
      );
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(
      "INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1, CURRENT_DATE, NOW(), 'present') RETURNING *",
      [emp.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

export async function checkOutMe(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    const todayQ = await pool.query('SELECT * FROM attendance WHERE employee_id=$1 AND date = CURRENT_DATE', [emp.id]);
    if (!todayQ.rowCount) return res.status(400).json({ error: 'No check-in found for today' });
    const att = todayQ.rows[0];
    if (!att.check_in) return res.status(400).json({ error: 'No check-in found' });
    if (att.check_out) return res.json(att); // idempotent

    // derive break_hours default from salary_structure; fallback 0
    const salQ = await pool.query('SELECT break_hours FROM salary_structure WHERE employee_id=$1', [emp.id]);
    const breakHours = salQ.rowCount ? Number(salQ.rows[0].break_hours || 0) : 0;
    const checkOut = new Date();
    const workHours = hoursBetween(att.check_in, checkOut, breakHours);
    const expected = DEFAULT_EXPECTED_DAILY_HOURS;
    const extraHours = workHours != null ? Math.max(0, Math.round((workHours - expected) * 100) / 100) : null;
    const { rows } = await pool.query(
      'UPDATE attendance SET check_out=$1, break_hours=$2, work_hours=$3, extra_hours=$4 WHERE id=$5 RETURNING *',
      [checkOut, breakHours, workHours, extraHours, att.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check out' });
  }
}

export async function getMyAttendance(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    const from = toDateOnly(req.query.from) || toDateOnly(new Date());
    const to = toDateOnly(req.query.to) || from;
    const { rows } = await pool.query(
      `SELECT date, check_in, check_out, work_hours, extra_hours, status
         FROM attendance WHERE employee_id=$1 AND date BETWEEN $2 AND $3
         ORDER BY date ASC`,
      [emp.id, from, to]
    );
    // summary
    const present = rows.filter(r => r.status === 'present').length;
    const leave = rows.filter(r => r.status === 'leave').length;
    const total_working_days = present + leave; // MVP: absent counts later when leave module ready
    res.json({ from, to, summary: { present_days: present, leave_days: leave, total_working_days }, days: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}

export async function listAttendanceByDate(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = req.user.role;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const date = toDateOnly(req.query.date) || toDateOnly(new Date());
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || '50', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM employees e WHERE e.company_id=$1', [companyId]);
    const total = countQ.rows[0].c;
    // Left join to include employees without attendance row yet
    const q = await pool.query(
      `SELECT e.id as employee_id, e.first_name, e.last_name, a.id as attendance_id, a.check_in, a.check_out, a.work_hours, a.extra_hours, a.status
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = $1
        WHERE e.company_id = $2
        ORDER BY e.first_name ASC, e.last_name ASC
        LIMIT $3 OFFSET $4`,
      [date, companyId, pageSize, offset]
    );
    res.json({ date, items: q.rows, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list attendance' });
  }
}

// Admin/HR: mark absents for a date for employees with no attendance AND no approved leave
export async function markAbsentsForDate(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = req.user.role;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const date = toDateOnly(req.query.date) || toDateOnly(new Date());
    // Employees without attendance on date and not on approved leave for date
    const empQ = await pool.query(
      `SELECT e.id
         FROM employees e
         LEFT JOIN attendance a ON a.employee_id=e.id AND a.date=$1
         LEFT JOIN leave_requests lr ON lr.employee_id=e.id AND lr.status='approved' AND lr.start_date <= $1 AND lr.end_date >= $1
        WHERE e.company_id=$2 AND a.id IS NULL AND lr.id IS NULL`,
      [date, companyId]
    );
    let inserted = 0;
    for (const r of empQ.rows) {
      await pool.query("INSERT INTO attendance (employee_id, date, status, work_hours, break_hours, extra_hours) VALUES ($1,$2,'absent',0,0,0)", [r.id, date]);
      inserted++;
    }
    res.json({ date, marked_absent: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to mark absents' });
  }
}
