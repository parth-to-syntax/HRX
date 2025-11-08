import express from 'express';
import { authRequired, permissionsAllowed } from '../middleware/auth.js';
import {
  listLeaveTypes,
  createLeaveType,
  createLeaveAllocation,
  listAllocations,
  listMyAllocations,
  createLeaveRequest,
  listLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
} from '../controllers/leaveController.js';

const router = express.Router();

// Leave types
router.get('/types', authRequired, listLeaveTypes);
router.post('/types', authRequired, permissionsAllowed('leaves','create'), createLeaveType);

// Allocations
router.get('/allocations', authRequired, permissionsAllowed('leaves','view'), listAllocations);
router.post('/allocations', authRequired, permissionsAllowed('leaves','create'), createLeaveAllocation);
router.get('/my-allocations', authRequired, listMyAllocations);

// Requests
router.get('/requests', authRequired, listLeaveRequests);
router.post('/requests', authRequired, createLeaveRequest);
router.patch('/requests/:id/approve', authRequired, permissionsAllowed('leaves','update'), approveLeaveRequest);
router.patch('/requests/:id/reject', authRequired, permissionsAllowed('leaves','update'), rejectLeaveRequest);

export default router;