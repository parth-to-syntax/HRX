import { pool } from '../db.js';

const PRIVATE_FIELDS = ['about_job', 'interests', 'hobbies', 'address'];
const EMPLOYEE_PUBLIC_FIELDS = `
  e.id, e.user_id, e.company_id,
  e.first_name, e.last_name, e.email, e.phone, e.location,
  e.avatar_url, e.resume_url,
  e.about_job, e.interests, e.hobbies,
  e.dob, e.nationality, e.gender, e.marital_status, e.address,
  e.date_of_joining, e.joining_serial,
  e.created_at, e.updated_at
`;

const PRIVATE_SENSITIVE_FIELDS = ['dob', 'nationality', 'gender', 'marital_status', 'address'];
const BANK_FIELDS = ['account_number', 'bank_name', 'ifsc_code', 'pan', 'uan', 'employee_code'];

export async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT ${EMPLOYEE_PUBLIC_FIELDS}
         FROM employees e
        WHERE e.user_id = $1
        LIMIT 1`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Employee profile not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateMyPrivateInfo(req, res) {
  try {
    const userId = req.user.id;
    const input = req.body || {};

    const updates = [];
    const values = [];
    let idx = 1;
    for (const key of PRIVATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        updates.push(`${key} = $${idx++}`);
        values.push(input[key]);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No allowed fields provided', allowed: PRIVATE_FIELDS });
    }
    const setClause = updates.join(', ') + ', updated_at = NOW()';
    values.push(userId);
    const { rowCount, rows } = await pool.query(
      `UPDATE employees SET ${setClause} WHERE user_id = $${idx} RETURNING id, about_job, interests, hobbies, address, updated_at`,
      values
    );
    if (!rowCount) return res.status(404).json({ error: 'Employee profile not found' });
    res.json({ message: 'Updated', profile: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

// Helpers
async function getEmployeeIdByUser(userId) {
  const { rows } = await pool.query('SELECT id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
  return rows.length ? rows[0].id : null;
}

// Admin/HR endpoints
export async function listEmployees(req, res) {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return res.status(400).json({ error: 'Missing company context' });
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM employees e WHERE e.company_id = $1', [companyId]);
    const total = countQ.rows[0].c;
    const q = await pool.query(
      `SELECT ${EMPLOYEE_PUBLIC_FIELDS}
         FROM employees e
        WHERE e.company_id = $1
        ORDER BY e.created_at DESC
        LIMIT $2 OFFSET $3`,
      [companyId, pageSize, offset]
    );
    res.json({ items: q.rows, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list employees' });
  }
}

export async function getEmployeeById(req, res) {
  try {
    const companyId = req.user.company_id;
    const { id } = req.params; // employee id
    if (!companyId) return res.status(400).json({ error: 'Missing company context' });
    const { rows } = await pool.query(
      `SELECT ${EMPLOYEE_PUBLIC_FIELDS}
         FROM employees e
        WHERE e.company_id = $1 AND e.id = $2
        LIMIT 1`,
      [companyId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
}

// Skills endpoints
export async function listMySkills(req, res) {
  try {
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });
    const { rows } = await pool.query('SELECT id, skill FROM employee_skills WHERE employee_id=$1 ORDER BY skill ASC', [empId]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
}

export async function addMySkill(req, res) {
  try {
    const { skill } = req.body || {};
    if (!skill || String(skill).trim().length === 0) return res.status(400).json({ error: 'skill is required' });
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });
    // prevent duplicates at app layer
    const exists = await pool.query('SELECT 1 FROM employee_skills WHERE employee_id=$1 AND LOWER(skill)=LOWER($2)', [empId, skill]);
    if (exists.rowCount) return res.status(409).json({ error: 'Skill already exists' });
    const { rows } = await pool.query('INSERT INTO employee_skills (employee_id, skill) VALUES ($1,$2) RETURNING id, skill', [empId, skill]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add skill' });
  }
}

export async function deleteMySkill(req, res) {
  try {
    const { id } = req.params;
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });
    const { rowCount } = await pool.query('DELETE FROM employee_skills WHERE id=$1 AND employee_id=$2', [id, empId]);
    if (!rowCount) return res.status(404).json({ error: 'Skill not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
}

// Certifications endpoints
export async function listMyCertifications(req, res) {
  try {
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });
    const { rows } = await pool.query(
      'SELECT id, title, issuer, issued_on, expires_on FROM employee_certifications WHERE employee_id=$1 ORDER BY issued_on DESC NULLS LAST, title ASC',
      [empId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
}

export async function addMyCertification(req, res) {
  try {
    const { title, issuer, issued_on, expires_on } = req.body || {};
    if (!title || String(title).trim().length === 0) return res.status(400).json({ error: 'title is required' });
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });
    const { rows } = await pool.query(
      'INSERT INTO employee_certifications (employee_id, title, issuer, issued_on, expires_on) VALUES ($1,$2,$3,$4,$5) RETURNING id, title, issuer, issued_on, expires_on',
      [empId, title, issuer || null, issued_on || null, expires_on || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add certification' });
  }
}

export async function updateMyCertification(req, res) {
  try {
    const { id } = req.params;
    const input = req.body || {};
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });

    const allowed = ['title', 'issuer', 'issued_on', 'expires_on'];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        updates.push(`${key} = $${idx++}`);
        values.push(input[key]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update', allowed });
    values.push(empId);
    values.push(id);
    const setClause = updates.join(', ');
    const { rowCount, rows } = await pool.query(
      `UPDATE employee_certifications SET ${setClause} WHERE employee_id = $${idx++} AND id = $${idx} RETURNING id, title, issuer, issued_on, expires_on`,
      values
    );
    if (!rowCount) return res.status(404).json({ error: 'Certification not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update certification' });
  }
}

export async function deleteMyCertification(req, res) {
  try {
    const { id } = req.params;
    const empId = await getEmployeeIdByUser(req.user.id);
    if (!empId) return res.status(404).json({ error: 'Employee profile not found' });
    const { rowCount } = await pool.query('DELETE FROM employee_certifications WHERE id=$1 AND employee_id=$2', [id, empId]);
    if (!rowCount) return res.status(404).json({ error: 'Certification not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete certification' });
  }
}

// Private sensitive info (personal + bank)
export async function getMyPrivateInfo(req, res) {
  try {
    const userId = req.user.id;
    const empQ = await pool.query(
      `SELECT e.id, e.user_id, e.company_id, e.dob, e.nationality, e.gender, e.marital_status, e.address, e.updated_at
         FROM employees e
        WHERE e.user_id = $1
        LIMIT 1`,
      [userId]
    );
    if (!empQ.rowCount) return res.status(404).json({ error: 'Employee profile not found' });
    const emp = empQ.rows[0];
    const bankQ = await pool.query(
      `SELECT id, account_number, bank_name, ifsc_code, pan, uan, employee_code
         FROM bank_details
        WHERE employee_id = $1
        LIMIT 1`,
      [emp.id]
    );
    res.json({ personal: {
      dob: emp.dob,
      nationality: emp.nationality,
      gender: emp.gender,
      marital_status: emp.marital_status,
      address: emp.address,
      updated_at: emp.updated_at
    }, bank: bankQ.rowCount ? bankQ.rows[0] : null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch private info' });
  }
}

export async function updateMyPrivateSensitive(req, res) {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const input = req.body || {};

    const empQ = await client.query('SELECT id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
    if (!empQ.rowCount) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    const empId = empQ.rows[0].id;

    const empUpdates = [];
    const empValues = [];
    let i = 1;
    for (const key of PRIVATE_SENSITIVE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        empUpdates.push(`${key} = $${i++}`);
        empValues.push(input[key]);
      }
    }

    const hasBankPayload = BANK_FIELDS.some(k => Object.prototype.hasOwnProperty.call(input, k) && input[k] !== undefined);

    if (empUpdates.length === 0 && !hasBankPayload) {
      return res.status(400).json({ error: 'No allowed fields provided', personal_allowed: PRIVATE_SENSITIVE_FIELDS, bank_allowed: BANK_FIELDS });
    }

    await client.query('BEGIN');

    if (empUpdates.length) {
      const setClause = empUpdates.join(', ') + ', updated_at = NOW()';
      empValues.push(userId);
      await client.query(`UPDATE employees SET ${setClause} WHERE user_id = $${i}`, empValues);
    }

    if (hasBankPayload) {
      // Build UPSERT for bank details
      const bankUpdates = [];
      const bankValues = [empId];
      let j = 2; // $1 is employee_id
      for (const key of BANK_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          bankUpdates.push(`${key}`);
          bankValues.push(input[key]);
        }
      }
      const cols = ['employee_id'].concat(bankUpdates);
      const valsPlaceholders = cols.map((_, idx) => `$${idx + 1}`);
      const setAssignments = bankUpdates.map((k, idx) => `${k} = EXCLUDED.${k}`).join(', ');

      if (bankUpdates.length) {
        await client.query(
          `INSERT INTO bank_details (${cols.join(', ')})
           VALUES (${valsPlaceholders.join(', ')})
           ON CONFLICT (employee_id) DO UPDATE SET ${setAssignments}`,
          bankValues
        );
      }
    }

    await client.query('COMMIT');

    // Return the updated view
    const personalQ = await pool.query(
      `SELECT e.dob, e.nationality, e.gender, e.marital_status, e.address, e.updated_at FROM employees e WHERE e.id=$1`,
      [empId]
    );
    const bankQ = await pool.query(
      `SELECT id, account_number, bank_name, ifsc_code, pan, uan, employee_code FROM bank_details WHERE employee_id=$1`,
      [empId]
    );
    res.json({ message: 'Updated', personal: personalQ.rows[0], bank: bankQ.rowCount ? bankQ.rows[0] : null });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error(e);
    res.status(500).json({ error: 'Failed to update private info' });
  } finally {
    client.release();
  }
}
