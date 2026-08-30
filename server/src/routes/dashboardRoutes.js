import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/summary', dashboardController.getSummary);

export default router;
