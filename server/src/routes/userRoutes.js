import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts'), userController.getCompanyUsers);
router.put('/presence', userController.updatePresence);
router.post('/', authorizeRoles('Owner'), userController.createUser);
router.put('/:id', authorizeRoles('Owner'), userController.updateUser);
router.delete('/:id', authorizeRoles('Owner'), userController.deleteUser);

export default router;
