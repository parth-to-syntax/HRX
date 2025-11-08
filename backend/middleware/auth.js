import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { hasPermission } from '../utils/access.js';

function parseCookie(header) {
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const [k, v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
}

export function authRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  let token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) {
    const cookies = parseCookie(req.headers.cookie || '');
    token = cookies.token || null;
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, company_id }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function rolesAllowed(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function permissionsAllowed(module, action) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const allowed = await hasPermission(pool, req.user.company_id, req.user.role, module, action);
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}
