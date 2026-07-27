import bcrypt from 'bcryptjs';
import companyRepository from '../repositories/companyRepository.js';
import userRepository from '../repositories/userRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import logger from '../config/logger.js';

class AuthService {
  async register({ businessName, ownerName, mobile, email, gstin, city, state, password, pin }) {
    const cleanMobile = mobile.replace(/\D/g, '');
    
    // Check if user already exists
    const existingUser = await userRepository.findByMobile(cleanMobile);
    if (existingUser) {
      const err = new Error('A user account with this mobile number already exists.');
      err.statusCode = 400;
      throw err;
    }

    // Generate custom IDs
    const timestampSuffix = Date.now().toString().slice(-4);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const companyId = `COMP-${timestampSuffix}-${randomStr}`;
    const ownerId = `USR-OWNE-${timestampSuffix}-${randomStr}`;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Company
    const company = await companyRepository.create({
      companyId,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      mobile: cleanMobile,
      email: email?.trim(),
      gstin: gstin?.trim(),
      city: city?.trim() || 'Pipariya',
      state: state?.trim() || 'Madhya Pradesh',
    });

    // Create User (Owner)
    const user = await userRepository.create({
      userId: ownerId,
      companyId,
      name: ownerName.trim(),
      mobile: cleanMobile,
      email: email?.trim(),
      password: hashedPassword,
      pin: pin ? await bcrypt.hash(pin.toString(), 10) : null,
      role: 'Owner',
      status: 'Active',
    });

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

  async seedDemoData() {
    // Disabled auto seeding so user can register fresh companies from scratch
    return;
  }
}

export default new AuthService();
