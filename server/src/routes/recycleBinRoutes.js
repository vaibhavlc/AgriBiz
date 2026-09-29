import express from 'express';
import recycleBinController from '../controllers/recycleBinController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('recycle'), recycleBinController.getRecycleBin);
router.post('/:id/restore', authorizePermission('recycle'), recycleBinController.restoreRecord);
router.delete('/:id', authorizePermission('recycle'), recycleBinController.deletePermanently);

export default router;
