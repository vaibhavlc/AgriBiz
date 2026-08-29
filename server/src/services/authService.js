import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import companyRepository from '../repositories/companyRepository.js';
import userRepository from '../repositories/userRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import settingsRepository from '../repositories/settingsRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import logger from '../config/logger.js';
import emailService from './emailService.js';
import PendingVerification from '../models/PendingVerification.js';
import OwnerPinReset from '../models/OwnerPinReset.js';

class AuthService {
  async register({ businessName, ownerName, mobile, email, gstin, city, state, password, pin, isEmailVerified = false }) {
    if (!email || !email.trim()) {
      const err = new Error('Email address is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if mobile or email already exists
    const existingUserMobile = await userRepository.findByMobile(cleanMobile);
    if (existingUserMobile) {
      const err = new Error('A user account with this mobile number already exists.');
      err.statusCode = 400;
      throw err;
    }

    const existingUserEmail = await userRepository.findByEmail(cleanEmail);
    if (existingUserEmail) {
      const err = new Error('A user account with this email address already exists.');
      err.statusCode = 400;
      throw err;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Verification Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate Company & Owner IDs
    const companyId = 'COMP-' + Date.now();
    const ownerId = 'USR-' + Date.now();

    // Check if email was verified in PendingVerification or via parameter
    const pendingDoc = await PendingVerification.findOne({ email: cleanEmail });
    const verifiedStatus = Boolean(isEmailVerified || (pendingDoc && pendingDoc.isVerified));

    if (!verifiedStatus) {
      const err = new Error('Please verify your email address before completing registration.');
      err.statusCode = 400;
      throw err;
    }

    // Create Company
    const company = await companyRepository.create({
      companyId,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      gstin: gstin?.trim() || '',
      city: city?.trim() || 'Pipariya',
      state: state?.trim() || 'Madhya Pradesh',
      plan: 'Enterprise Business Suite',
      subscriptionStatus: 'Active',
    });

    // Create Company Settings
    try {
      await settingsRepository.create({
        companyId,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: cleanMobile,
        email: cleanEmail,
        gstin: gstin?.trim() || '',
        city: city?.trim() || 'Pipariya',
        state: state?.trim() || 'Madhya Pradesh',
        address: `${city?.trim() || ''}, ${state?.trim() || ''}`.trim(),
      });
    } catch (sErr) {
      logger.warn('Failed to create initial settings during registration: %s', sErr.message);
    }

    // Create User (Owner) - Always set isEmailVerified to true since verification is required before submit
    const user = await userRepository.create({
      userId: ownerId,
      companyId,
      name: ownerName.trim(),
      mobile: cleanMobile,
      email: cleanEmail,
      password: hashedPassword,
      pin: pin ? await bcrypt.hash(pin.toString(), 10) : null,
      role: 'Owner',
      status: 'Active',
      isEmailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    });

    // Clear pending verification documents for this email
    await PendingVerification.deleteMany({ email: cleanEmail });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user.userId,
      expiresAt,
    });

    return { user, company, accessToken, refreshToken };
  }

  async verifyEmail(rawToken) {
    if (!rawToken || !rawToken.trim()) {
      const err = new Error('Verification token is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanToken = rawToken.trim();
    const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');

    // 1. Check User by token hash
    let user = await userRepository.findByVerificationTokenHash(tokenHash);

    if (user) {
      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        const err = new Error('Verification link has expired. Please request a new verification email.');
        err.statusCode = 400;
        throw err;
      }

      user.isEmailVerified = true;
      user.emailVerificationTokenHash = null;
      user.emailVerificationExpires = null;
      await user.save();
      await PendingVerification.deleteMany({ email: user.email.toLowerCase() });
      return { success: true, email: user.email, message: 'Email verified successfully!' };
    }

    // 2. Check PendingVerification by token hash
    const pending = await PendingVerification.findOne({ tokenHash });
    if (pending) {
      if (pending.expiresAt < new Date()) {
        await PendingVerification.deleteOne({ _id: pending._id });
        const err = new Error('Verification link has expired. Please request a new verification email.');
        err.statusCode = 400;
        throw err;
      }

      const pendingEmail = pending.email.toLowerCase();
      user = await userRepository.findByEmail(pendingEmail);
      if (user) {
        user.isEmailVerified = true;
        user.emailVerificationTokenHash = null;
        user.emailVerificationExpires = null;
        await user.save();
      }

      pending.isVerified = true;
      await pending.save();
      return { success: true, email: pendingEmail, message: 'Email verified successfully!' };
    }

    const err = new Error('Invalid, expired, or already-used verification link.');
    err.statusCode = 400;
    throw err;
  }

  async resendVerificationEmail(email) {
    if (!email || !email.trim()) {
      const err = new Error('Email address is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(cleanEmail);

    if (user && user.isEmailVerified) {
      return {
        success: true,
        message: 'This email address is already verified!',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (user) {
      user.emailVerificationTokenHash = tokenHash;
      user.emailVerificationExpires = expiresAt;
      await user.save();
    } else {
      await PendingVerification.findOneAndUpdate(
        { email: cleanEmail },
        { email: cleanEmail, tokenHash, expiresAt },
        { upsert: true, new: true }
      );
    }

    // Always send real verification email via Gmail SMTP
    await emailService.sendVerificationEmail(cleanEmail, rawToken, user?.name || 'Owner');

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async login(mobile, password, role) {
    const cleanMobile = mobile.replace(/\D/g, '');
    
    // Find User
    const user = await userRepository.findByMobile(cleanMobile);
    if (!user) {
      const err = new Error('No account found with this mobile number.');
      err.statusCode = 404;
      throw err;
    }

    if (role && user.role !== role) {
      const err = new Error(`The selected role does not match this user's account role.`);
      err.statusCode = 403;
      throw err;
    }

    if (user.status === 'Inactive') {
      const err = new Error('Your user account has been disabled by the business Owner.');
      err.statusCode = 403;
      throw err;
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid password. Please check your credentials and try again.');
      err.statusCode = 401;
      throw err;
    }

    // Find Company
    const company = await companyRepository.findById(user.companyId);
    if (!company || !company.isActive) {
      const err = new Error('Your business account is suspended or inactive.');
      err.statusCode = 403;
      throw err;
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user.userId,
      expiresAt,
    });

    return { user, company, accessToken, refreshToken };
  }

  async staffLogin(companyId, userId, pin) {
    // Find User
    const user = await userRepository.findById(userId);
    if (!user || user.companyId !== companyId) {
      const err = new Error('No staff account found for this member.');
      err.statusCode = 404;
      throw err;
    }

    if (user.status === 'Inactive') {
      const err = new Error('This staff account has been disabled by the business Owner.');
      err.statusCode = 403;
      throw err;
    }

    // Verify PIN
    if (!user.pin) {
      const err = new Error('Security PIN has not been set for this staff member.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(pin.toString(), user.pin);
    if (!isMatch) {
      const err = new Error('Invalid PIN. Please check and try again.');
      err.statusCode = 401;
      throw err;
    }

    // Find Company
    const company = await companyRepository.findById(companyId);
    if (!company || !company.isActive) {
      const err = new Error('Your business account is suspended or inactive.');
      err.statusCode = 403;
      throw err;
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user.userId,
      expiresAt,
    });

    return { user, company, accessToken, refreshToken };
  }

  async refresh(token) {
    // Find token in database
    const tokenDoc = await refreshTokenRepository.findToken(token);
    if (!tokenDoc) {
      const err = new Error('Invalid refresh token.');
      err.statusCode = 401;
      throw err;
    }

    // Verify token expiration/validity
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (e) {
      await refreshTokenRepository.deleteToken(token);
      const err = new Error('Expired or invalid refresh token.');
      err.statusCode = 401;
      throw err;
    }

    // Find User
    const user = await userRepository.findById(decoded.userId);
    if (!user || user.status === 'Inactive') {
      await refreshTokenRepository.deleteToken(token);
      const err = new Error('User account is inactive or not found.');
      err.statusCode = 401;
      throw err;
    }

    const company = await companyRepository.findById(user.companyId);
    if (!company || !company.isActive) {
      await refreshTokenRepository.deleteToken(token);
      const err = new Error('Company is inactive or not found.');
      err.statusCode = 401;
      throw err;
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return { user, company, accessToken, refreshToken: token };
  }

  async logout(token) {
    if (token) {
      await refreshTokenRepository.deleteToken(token);
    }
  }

  async resetPassword(mobile, newPassword) {
    const cleanMobile = mobile.replace(/\D/g, '');
    const user = await userRepository.findByMobile(cleanMobile);
    
    if (!user) {
      const err = new Error('No account registered with this mobile number.');
      err.statusCode = 404;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Revoke all previous refresh tokens for this user
    await refreshTokenRepository.deleteUserTokens(user.userId);

    return true;
  }

  async forgotOwnerPin({ companyId, userId }) {
    if (!companyId || !userId) {
      const err = new Error('Company ID and User ID are required.');
      err.statusCode = 400;
      throw err;
    }

    const user = await userRepository.findById(userId);
    if (!user || user.companyId !== companyId) {
      const err = new Error('Staff user profile not found.');
      err.statusCode = 404;
      throw err;
    }

    // STRICT CHECK: Forgot PIN is ONLY for Owner role
    if (user.role !== 'Owner') {
      const err = new Error('Forgot PIN is only available for the Owner account.');
      err.statusCode = 403;
      throw err;
    }

    if (!user.email) {
      const err = new Error('No registered email found for Owner.');
      err.statusCode = 400;
      throw err;
    }

    const company = await companyRepository.findById(companyId);

    // Delete any existing reset tokens for this owner
    await OwnerPinReset.deleteMany({ userId: user.userId, companyId: user.companyId });

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await OwnerPinReset.create({
      userId: user.userId,
      companyId: user.companyId,
      email: user.email,
      tokenHash,
      expiresAt,
    });

    // Send email via emailService
    await emailService.sendOwnerPinResetEmail(
      user.email,
      rawToken,
      user.name || 'Owner',
      company?.businessName || 'AgriBiz Suite'
    );

    return {
      message: `A secure Owner PIN reset link has been sent to ${user.email}. Please check your inbox.`,
    };
  }

  async resetOwnerPin({ token, newPin }) {
    if (!token) {
      const err = new Error('PIN reset token is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!newPin || !/^\d{4}$/.test(newPin.toString())) {
      const err = new Error('PIN must be exactly 4 numeric digits.');
      err.statusCode = 400;
      throw err;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetDoc = await OwnerPinReset.findOne({ tokenHash });

    if (!resetDoc || resetDoc.expiresAt < new Date()) {
      const err = new Error('Invalid or expired PIN reset link.');
      err.statusCode = 400;
      throw err;
    }

    const user = await userRepository.findById(resetDoc.userId);
    if (!user || user.role !== 'Owner') {
      const err = new Error('Owner account not found or unauthorized.');
      err.statusCode = 400;
      throw err;
    }

    // Hash new PIN and save
    const hashedPin = await bcrypt.hash(newPin.toString(), 10);
    user.pin = hashedPin;
    await user.save();

    // Invalidate the token immediately after successful reset
    await OwnerPinReset.deleteOne({ _id: resetDoc._id });

    logger.info('[AUTH SERVICE] Owner PIN reset successfully for user %s (company %s)', user.userId, user.companyId);

    return {
      message: 'Owner PIN reset successfully! You can now log in with your new PIN.',
    };
  }

  async seedDemoData() {
    // Disabled auto seeding so user can register fresh companies from scratch
    return;
  }
}

export default new AuthService();
