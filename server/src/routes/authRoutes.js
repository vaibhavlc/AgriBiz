import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { registerSchema, loginSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema } from '../validators/authValidator.js';

const router = express.Router();

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 5000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many verification email requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerification);
router.post('/login', validate(loginSchema), authController.login);
router.post('/staff-login', authController.staffLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/forgot-owner-pin', authController.forgotOwnerPin);
router.post('/reset-owner-pin', authController.resetOwnerPin);

export default router;
