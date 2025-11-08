import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  enrollFace,
  getMyEnrollment,
  checkInWithFace,
  deleteMyEnrollment,
  getMyFaceStats
} from '../controllers/faceController.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Face enrollment
router.post('/enroll', enrollFace);
router.get('/enrollment/me', getMyEnrollment);
router.delete('/enrollment/me', deleteMyEnrollment);

// Face check-in
router.post('/checkin', checkInWithFace);

// Statistics
router.get('/stats/me', getMyFaceStats);

export default router;
