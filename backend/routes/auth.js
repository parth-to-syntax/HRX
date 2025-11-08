import express from 'express';
import { registerEmployee, login, resetFirstPassword, forgotPassword, applyPasswordReset } from '../controllers/authController.js';
import { authRequired, rolesAllowed } from '../middleware/auth.js';

const router = express.Router();

// Registration (admin/hr only)
router.post('/register', authRequired, rolesAllowed('admin','hr'), registerEmployee);

// Login
router.post('/login', login);

// First login password reset
router.post('/first-reset', resetFirstPassword);

// Forgot / reset password
router.post('/forgot', forgotPassword);
router.post('/reset', applyPasswordReset);

// Example protected route
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
