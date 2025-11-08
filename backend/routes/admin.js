import express from 'express';
import { authRequired, rolesAllowed } from '../middleware/auth.js';
import { listUsers, getAccessRights, upsertAccessRights, updateUserRole } from '../controllers/adminController.js';

const router = express.Router();

// List users (id, name, email, role) - admin only
router.get('/users', authRequired, rolesAllowed('admin'), listUsers);
router.patch('/users/:id/role', authRequired, rolesAllowed('admin'), updateUserRole);

// Get access rights matrix - admin only
router.get('/access-rights', authRequired, rolesAllowed('admin'), getAccessRights);

// Upsert access rights entries - admin only
router.post('/access-rights', authRequired, rolesAllowed('admin'), upsertAccessRights);

export default router;
