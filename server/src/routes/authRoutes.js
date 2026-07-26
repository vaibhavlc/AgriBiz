import express from 'express';
import authController from '../controllers/authController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { registerSchema, loginSchema, resetPasswordSchema } from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
