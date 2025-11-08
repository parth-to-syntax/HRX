import express from 'express';
import { authRequired, permissionsAllowed } from '../middleware/auth.js';
import { checkInMe, checkOutMe, getMyAttendance, listAttendanceByDate, markAbsentsForDate } from '../controllers/attendanceController.js';
import { rolesAllowed } from '../middleware/auth.js';

const router = express.Router();

// Self actions
router.post('/me/check-in', authRequired, checkInMe);
router.post('/me/check-out', authRequired, checkOutMe);
router.get('/me', authRequired, getMyAttendance);

// Admin/HR: list by date
router.get('/', authRequired, permissionsAllowed('attendance','view'), listAttendanceByDate);
router.post('/mark-absents', authRequired, permissionsAllowed('attendance','update'), markAbsentsForDate);

export default router;