import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/summary', authorizePermission('dashboard'), dashboardController.getSummary);

export default router;
