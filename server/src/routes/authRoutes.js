import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController.js';
import biometricController from '../controllers/biometricController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { registerSchema, loginSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema } from '../validators/authValidator.js';

const router = express.Router();

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 5000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many verification email requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 5000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 5000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many PIN verification attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 5000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, message: 'Too many reset attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', resendLimiter, validate(resendVerificationSchema), authController.resendVerification);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/staff-login', pinLimiter, authController.staffLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', resetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/forgot-owner-pin', resetLimiter, authController.forgotOwnerPin);
router.post('/reset-owner-pin', resetLimiter, authController.resetOwnerPin);

// Biometric / WebAuthn Endpoints
router.get('/biometric/status', biometricController.getStatus);
router.post('/biometric/login-options', biometricController.getAuthOptions);
router.post('/biometric/login-verify', biometricController.verifyAuth);

// Authenticated Biometric Enrollment & Management
router.post('/biometric/register-options', authenticate, biometricController.getRegisterOptions);
router.post('/biometric/register-verify', authenticate, biometricController.verifyRegister);
router.get('/biometric/credentials', authenticate, biometricController.listCredentials);
router.delete('/biometric/credentials/:id', authenticate, biometricController.revokeCredential);

export default router;
