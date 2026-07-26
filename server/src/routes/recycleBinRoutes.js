import express from 'express';
import recycleBinController from '../controllers/recycleBinController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner'), recycleBinController.getRecycleBin);
router.post('/:id/restore', authorizeRoles('Owner'), recycleBinController.restoreRecord);
router.delete('/:id', authorizeRoles('Owner'), recycleBinController.deletePermanently);

export default router;
