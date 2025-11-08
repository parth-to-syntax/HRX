import { pool } from '../db.js';

function toDateOnly(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function getEmployeeByUser(userId) {
  const { rows } = await pool.query('SELECT id, company_id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
  return rows.length ? rows[0] : null;
}

// Leave Types
export async function listLeaveTypes(_req, res) {
  try {
    const { rows } = await pool.query('SELECT id, name, is_paid FROM leave_types ORDER BY name ASC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list leave types' });
  }
}

export async function createLeaveType(req, res) {
  try {
    const role = req.user.role;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { name, is_paid } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const { rows } = await pool.query('INSERT INTO leave_types (name, is_paid) VALUES ($1,$2) RETURNING id, name, is_paid', [name, !!is_paid]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create leave type' });
  }
}

// Leave Allocations
export async function createLeaveAllocation(req, res) {
  try {
    const role = req.user.role;
    const companyId = req.user.company_id;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { employee_id, leave_type_id, allocated_days, valid_from, valid_to, notes } = req.body || {};
    if (!employee_id || !leave_type_id || allocated_days == null) return res.status(400).json({ error: 'employee_id, leave_type_id, allocated_days required' });
    // scope employee to company
    const empQ = await pool.query('SELECT id FROM employees WHERE id=$1 AND company_id=$2', [employee_id, companyId]);
    if (!empQ.rowCount) return res.status(404).json({ error: 'Employee not found' });
    const { rows } = await pool.query(
      `INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, valid_from, valid_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, employee_id, leave_type_id, allocated_days, used_days, valid_from, valid_to, notes, created_at`,
      [employee_id, leave_type_id, allocated_days, valid_from || null, valid_to || null, notes || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create allocation' });
  }
}

export async function listMyAllocations(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    const { rows } = await pool.query(
      `SELECT la.id, lt.name as leave_type, la.allocated_days, la.used_days, la.valid_from, la.valid_to
         FROM leave_allocations la
         JOIN leave_types lt ON lt.id = la.leave_type_id
        WHERE la.employee_id=$1
        ORDER BY lt.name ASC`,
      [emp.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list allocations' });
  }
}

export async function listAllocations(req, res) {
  try {
    const role = req.user.role;
    const companyId = req.user.company_id;
    if (!['admin','hr'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { employee_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;
    const params = [companyId];
    let where = 'e.company_id = $1';
    if (employee_id) { params.push(employee_id); where += ` AND la.employee_id = $${params.length}`; }
    const countQ = await pool.query(
      `SELECT COUNT(*)::int AS c
         FROM leave_allocations la
         JOIN employees e ON e.id = la.employee_id
        WHERE ${where}`,
      params
    );
    params.push(pageSize, offset);
    const q = await pool.query(
      `SELECT la.id, la.employee_id, e.first_name, e.last_name, lt.name as leave_type, la.allocated_days, la.used_days, la.valid_from, la.valid_to
         FROM leave_allocations la
         JOIN employees e ON e.id = la.employee_id
         JOIN leave_types lt ON lt.id = la.leave_type_id
        WHERE ${where}
        ORDER BY e.first_name ASC, e.last_name ASC, lt.name ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ items: q.rows, page, pageSize, total: countQ.rows[0].c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list allocations' });
  }
}

// Leave Requests
export async function createLeaveRequest(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    const { leave_type_id, start_date, end_date, notes, attachment_url } = req.body || {};
    if (!leave_type_id || !start_date || !end_date) return res.status(400).json({ error: 'leave_type_id, start_date, end_date required' });
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, notes, attachment_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, employee_id, leave_type_id, start_date, end_date, status, created_at` ,
      [emp.id, leave_type_id, start_date, end_date, notes || null, attachment_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
}

export async function listLeaveRequests(req, res) {
  try {
    const role = req.user.role;
    const companyId = req.user.company_id;
    if (['admin','hr','payroll'].includes(role)) {
      // Admin HR view
      const { employee_id, status } = req.query;
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
      const offset = (page - 1) * pageSize;
      const params = [companyId];
      let where = 'e.company_id = $1';
      if (employee_id) { params.push(employee_id); where += ` AND lr.employee_id = $${params.length}`; }
      if (status) { params.push(status); where += ` AND lr.status = $${params.length}`; }
      const countQ = await pool.query(
        `SELECT COUNT(*)::int AS c
           FROM leave_requests lr
           JOIN employees e ON e.id = lr.employee_id
           JOIN leave_types lt ON lt.id = lr.leave_type_id
          WHERE ${where}`,
        params
      );
      params.push(pageSize, offset);
      const q = await pool.query(
        `SELECT lr.*, e.first_name, e.last_name, lt.name as leave_type
           FROM leave_requests lr
           JOIN employees e ON e.id = lr.employee_id
           JOIN leave_types lt ON lt.id = lr.leave_type_id
          WHERE ${where}
          ORDER BY lr.created_at DESC
          LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.json({ items: q.rows, page, pageSize, total: countQ.rows[0].c });
    }
    // Employee view
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM leave_requests WHERE employee_id=$1', [emp.id]);
    const q = await pool.query(
      `SELECT lr.*, e.first_name, e.last_name, lt.name as leave_type
         FROM leave_requests lr
         JOIN employees e ON e.id = lr.employee_id
         JOIN leave_types lt ON lt.id = lr.leave_type_id
        WHERE lr.employee_id=$1
        ORDER BY lr.created_at DESC
        LIMIT $2 OFFSET $3`,
      [emp.id, pageSize, offset]
    );
    res.json({ items: q.rows, page, pageSize, total: countQ.rows[0].c });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list leave requests' });
  }
}

async function upsertAttendanceLeaveForRange(client, employeeId, startDate, endDate) {
  let d = startDate;
  while (d <= endDate) {
    // If attendance exists with check_in, skip (treated as present already)
    const att = await client.query('SELECT id, check_in FROM attendance WHERE employee_id=$1 AND date=$2', [employeeId, d]);
    if (!att.rowCount) {
      await client.query(
        "INSERT INTO attendance (employee_id, date, status, work_hours, break_hours, extra_hours) VALUES ($1,$2,'leave',0,0,0)",
        [employeeId, d]
      );
    } else if (!att.rows[0].check_in) {
      await client.query(
        "UPDATE attendance SET status='leave', check_in=NULL, check_out=NULL, work_hours=0, break_hours=0, extra_hours=0 WHERE id=$1",
        [att.rows[0].id]
      );
    }
    d = addDays(d, 1);
  }
}

export async function approveLeaveRequest(req, res) {
  const client = await pool.connect();
  try {
    const role = req.user.role;
    const companyId = req.user.company_id;
    if (!['admin', 'hr', 'payroll'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    await client.query('BEGIN');
    const lrQ = await client.query(
      `SELECT lr.*, e.company_id FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id WHERE lr.id=$1`,
      [id]
    );
    if (!lrQ.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Leave request not found' }); }
    const reqRow = lrQ.rows[0];
    if (reqRow.company_id !== companyId) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Forbidden' }); }
    if (reqRow.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Request already processed' }); }

    // Update status
    await client.query(
      `UPDATE leave_requests SET status='approved', reviewed_by=$1, updated_at=NOW() WHERE id=$2`,
      [req.user.id, id]
    );

    // Increment allocation.used_days if allocation exists (pick any matching type)
    const days = Math.floor((new Date(reqRow.end_date) - new Date(reqRow.start_date)) / 86400000) + 1;
    const allocQ = await client.query(
      `SELECT id, used_days FROM leave_allocations WHERE employee_id=$1 AND leave_type_id=$2 ORDER BY created_at ASC LIMIT 1`,
      [reqRow.employee_id, reqRow.leave_type_id]
    );
    if (allocQ.rowCount) {
      await client.query('UPDATE leave_allocations SET used_days=$1 WHERE id=$2', [Number(allocQ.rows[0].used_days || 0) + days, allocQ.rows[0].id]);
    }

    // Upsert attendance rows as leave
    const start = toDateOnly(reqRow.start_date);
    const end = toDateOnly(reqRow.end_date);
    await upsertAttendanceLeaveForRange(client, reqRow.employee_id, start, end);

    await client.query('COMMIT');
    res.json({ message: 'Approved', id });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch(_) {}
    console.error(e);
    res.status(500).json({ error: 'Failed to approve leave request' });
  } finally {
    client.release();
  }
}

export async function rejectLeaveRequest(req, res) {
  try {
    const role = req.user.role;
    const companyId = req.user.company_id;
    if (!['admin', 'hr', 'payroll'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const lrQ = await pool.query(
      `SELECT lr.*, e.company_id FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id WHERE lr.id=$1`,
      [id]
    );
    if (!lrQ.rowCount) return res.status(404).json({ error: 'Leave request not found' });
    if (lrQ.rows[0].company_id !== companyId) return res.status(403).json({ error: 'Forbidden' });
    if (lrQ.rows[0].status !== 'pending') return res.status(400).json({ error: 'Request already processed' });
    await pool.query(`UPDATE leave_requests SET status='rejected', reviewed_by=$1, updated_at=NOW() WHERE id=$2`, [req.user.id, id]);
    res.json({ message: 'Rejected', id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
}
