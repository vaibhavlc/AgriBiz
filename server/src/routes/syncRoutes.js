import express from 'express';
import syncController from '../controllers/syncController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', syncController.processSyncBatch);
router.get('/pull', syncController.pullUpdates);

export default router;
