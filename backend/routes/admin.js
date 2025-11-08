import express from 'express';
import { authRequired, rolesAllowed } from '../middleware/auth.js';
import { listUsers, getAccessRights, upsertAccessRights } from '../controllers/adminController.js';

const router = express.Router();

// List users (id, name, email, role) - admin only
router.get('/users', authRequired, rolesAllowed('admin'), listUsers);

// Get access rights matrix - admin only
router.get('/access-rights', authRequired, rolesAllowed('admin'), getAccessRights);

// Upsert access rights entries - admin only
router.post('/access-rights', authRequired, rolesAllowed('admin'), upsertAccessRights);

export default router;
