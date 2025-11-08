import express from 'express';
import { registerEmployee, login, resetFirstPassword, forgotPassword, applyPasswordReset, publicSignup, logout, changePassword } from '../controllers/authController.js';
import { authRequired, rolesAllowed } from '../middleware/auth.js';

const router = express.Router();

// Registration (admin/hr only)
router.post('/register', authRequired, rolesAllowed('admin','hr'), registerEmployee);
// Public self-signup (employee role)
router.post('/public-signup', publicSignup);

// Login
router.post('/login', login);

// First login password reset
router.post('/first-reset', resetFirstPassword);

// Forgot / reset password
router.post('/forgot', forgotPassword);
router.post('/reset', applyPasswordReset);

// Logout (stateless: just cookie clear)
router.post('/logout', logout);

// Change password for authenticated users
router.post('/change-password', authRequired, changePassword);

// Example protected route
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
