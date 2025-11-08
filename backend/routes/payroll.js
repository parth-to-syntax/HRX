import express from 'express';
import { authRequired, rolesAllowed } from '../middleware/auth.js';
import {
  createPayrun,
  listPayruns,
  getPayrun,
  listPayslipsForPayrun,
  getPayslip,
  listMyPayslips,
  validatePayrun,
  validatePayslip,
  cancelPayslip,
  recomputePayslip,
  getPayslipPdf,
  getEmployeeYearSalaryPdf,
  monthlyEmployerCost,
  monthlyEmployeeCount
} from '../controllers/payrollController.js';

const router = express.Router();

// Payrun management (admin/payroll)
router.post('/payruns', authRequired, rolesAllowed('admin','payroll'), createPayrun);
router.get('/payruns', authRequired, rolesAllowed('admin','payroll'), listPayruns);
router.get('/payruns/:id', authRequired, rolesAllowed('admin','payroll'), getPayrun);
router.get('/payruns/:id/payslips', authRequired, rolesAllowed('admin','payroll'), listPayslipsForPayrun);
router.post('/payruns/:id/validate', authRequired, rolesAllowed('admin','payroll'), validatePayrun);

// Payslip detail
router.get('/payslips/:id', authRequired, getPayslip);
router.post('/payslips/:id/validate', authRequired, rolesAllowed('admin','payroll'), validatePayslip);
router.post('/payslips/:id/cancel', authRequired, rolesAllowed('admin','payroll'), cancelPayslip);
router.post('/payslips/:id/recompute', authRequired, rolesAllowed('admin','payroll'), recomputePayslip);
router.get('/payslips/:id/pdf', authRequired, getPayslipPdf);

// Yearly salary PDF (employee can fetch own; admin/payroll can fetch any employee)
router.get('/employees/:employee_id/salary-report/pdf', authRequired, getEmployeeYearSalaryPdf);
router.get('/me/salary-report/pdf', authRequired, (req, res, next) => {
  // map to same controller with own employee id
  req.params.employee_id = 'self'; // sentinel, controller will check via req.user
  next();
}, async (req, res, next) => {
  // Resolve self employee id before controller
  try {
    const { pool } = await import('../db.js');
    const me = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
    if (!me.rowCount) return res.status(404).json({ error: 'Employee profile not found' });
    req.params.employee_id = me.rows[0].id;
    return getEmployeeYearSalaryPdf(req, res);
  } catch (e) { next(e); }
});

// Metrics
router.get('/metrics/employer-cost', authRequired, rolesAllowed('admin','payroll'), monthlyEmployerCost);
router.get('/metrics/employee-count', authRequired, rolesAllowed('admin','payroll'), monthlyEmployeeCount);

// Self payslips
router.get('/me/payslips', authRequired, listMyPayslips);

export default router;
