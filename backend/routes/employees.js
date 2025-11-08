import express from 'express';
import { authRequired, permissionsAllowed } from '../middleware/auth.js';
import {
	getMyProfile,
	updateMyPrivateInfo,
	getMyPrivateInfo,
	updateMyPrivateSensitive,
	listMySkills,
	addMySkill,
	deleteMySkill,
	listMyCertifications,
	addMyCertification,
	updateMyCertification,
	deleteMyCertification,
	listEmployees,
	getEmployeeById
} from '../controllers/employeesController.js';

const router = express.Router();

router.get('/me', authRequired, getMyProfile);
router.patch('/me/private', authRequired, updateMyPrivateInfo);
router.get('/me/private-info', authRequired, getMyPrivateInfo);
router.patch('/me/private-info', authRequired, updateMyPrivateSensitive);

// Skills
router.get('/me/skills', authRequired, listMySkills);
router.post('/me/skills', authRequired, addMySkill);
router.delete('/me/skills/:id', authRequired, deleteMySkill);

// Certifications
router.get('/me/certifications', authRequired, listMyCertifications);
router.post('/me/certifications', authRequired, addMyCertification);
router.patch('/me/certifications/:id', authRequired, updateMyCertification);
router.delete('/me/certifications/:id', authRequired, deleteMyCertification);

// Admin/HR via permissions
router.get('/', authRequired, permissionsAllowed('employees','view'), listEmployees);
router.get('/:id', authRequired, permissionsAllowed('employees','view'), getEmployeeById);

export default router;
