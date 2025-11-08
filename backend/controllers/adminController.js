import { pool } from '../db.js';
import { DEFAULT_RIGHTS } from '../utils/access.js';

export async function listUsers(req, res) {
  // Admin only via route
  try {
    const { rows } = await pool.query(
      `SELECT u.id, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS name, e.email, u.role
         FROM users u
         LEFT JOIN employees e ON e.user_id = u.id
        WHERE u.company_id = $1
        ORDER BY name NULLS LAST, u.role, u.id`,
      [req.user.company_id]
    );
    res.json(rows.map(r=>({ id: r.id, name: (r.name || '').trim(), email: r.email || null, role: r.role })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

export async function updateUserRole(req, res) {
  // Admin only via route; can only change roles within same company
  try {
    const { id } = req.params; // user id
    const { role } = req.body || {};
    const allowed = ['admin','hr','payroll','employee'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ error: 'Invalid role', allowed });
    }
    const { rowCount, rows } = await pool.query(
      `UPDATE users SET role=$1 WHERE id=$2 AND company_id=$3 RETURNING id, role`,
      [role, id, req.user.company_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ id: rows[0].id, role: rows[0].role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update role' });
  }
}

export async function getAccessRights(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT role, module, permissions FROM access_rights WHERE company_id=$1`,
      [req.user.company_id]
    );
    if (!rows.length) return res.json(DEFAULT_RIGHTS);
    const result = { admin:{}, hr:{}, payroll:{}, employee:{} };
    for (const r of rows) {
      if (!result[r.role]) result[r.role] = {};
      result[r.role][r.module] = r.permissions;
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch access rights' });
  }
}

export async function upsertAccessRights(req, res) {
  try {
    // Expect body: [{ role, module, permissions: { view?:bool, create?:bool, update?:bool, delete?:bool, manage?:bool } }, ...]
    const entries = Array.isArray(req.body) ? req.body : [];
    if (!entries.length) return res.status(400).json({ error: 'Provide an array of access rights entries' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const e of entries) {
        if (!e.role || !e.module || !e.permissions) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Each entry requires role, module, permissions' });
        }
        await client.query(
          `INSERT INTO access_rights (company_id, role, module, permissions)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (company_id, role, module)
           DO UPDATE SET permissions = EXCLUDED.permissions`,
          [req.user.company_id, e.role, e.module, e.permissions]
        );
      }
      await client.query('COMMIT');
      res.json({ updated: entries.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update access rights' });
  }
}
