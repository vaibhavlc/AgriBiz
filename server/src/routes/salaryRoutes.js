import express from 'express';
import salaryController from '../controllers/salaryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/records', salaryController.getSalaryRecords);
router.post('/records', salaryController.createSalaryRecord);
router.post('/records/:id/pay', salaryController.recordSalaryPayment);

router.get('/advances', salaryController.getSalaryAdvances);
router.post('/advances', salaryController.createSalaryAdvance);

export default router;
