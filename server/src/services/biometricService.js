import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import BiometricCredential from '../models/BiometricCredential.js';
import BiometricChallenge from '../models/BiometricChallenge.js';
import userRepository from '../repositories/userRepository.js';
import companyRepository from '../repositories/companyRepository.js';
import refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import logger from '../config/logger.js';

function formatBiometricPromptTitle(businessName) {
  const raw = (businessName || '').trim() || 'Daivyayog';
  if (raw.includes('अनलॉक') || raw.startsWith('Unlock')) {
    if (raw.length > 40) {
      return `${raw.slice(0, 36).trim()}…`;
    }
    return raw;
  }
  const clean = raw.replace(/^Unlock\s+/i, '');
  if (clean.length > 35) {
    return `Unlock ${clean.slice(0, 32).trim()}…`;
  }
  return `Unlock ${clean}`;
}

function getRpInfo(originHeader, hostHeader, businessName) {
  let origin = originHeader || (hostHeader ? `http://${hostHeader}` : 'http://localhost:5173');
  let rpID = 'localhost';
  const expectedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
  ];

  if (process.env.CLIENT_URL) {
    expectedOrigins.push(process.env.CLIENT_URL);
  }
  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach((o) => expectedOrigins.push(o.trim()));
  }

  try {
    const parsed = new URL(origin);
    rpID = parsed.hostname;
    if (!expectedOrigins.includes(parsed.origin)) {
      expectedOrigins.push(parsed.origin);
    }
  } catch (e) {
    logger.warn('Could not parse origin for WebAuthn: %s', origin);
  }

  return {
    rpID,
    expectedOrigins,
    rpName: formatBiometricPromptTitle(businessName),
  };
}

class BiometricService {
  async generateRegisterOptions(user, originHeader, hostHeader, customBusinessName) {
    let businessName = customBusinessName;
    if (!businessName && user.companyId) {
      try {
        const comp = await companyRepository.findById(user.companyId);
        if (comp && comp.businessName) {
          businessName = comp.businessName;
        }
      } catch (err) {
        logger.warn('Could not lookup company for biometric rpName: %s', err?.message);
      }
    }

    const { rpID, rpName } = getRpInfo(originHeader, hostHeader, businessName);

    // Find any existing active credentials to avoid duplicates
    const existingCreds = await BiometricCredential.find({
      userId: user.userId,
      companyId: user.companyId,
      isActive: true,
    });

    const excludeCredentials = existingCreds.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.userId, 'utf-8')),
      userName: user.name ? `${user.name} (${user.role || 'Staff'})` : (user.email || user.mobile || user.userId),
      userDisplayName: user.name || user.email || 'Staff Member',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge with 5-minute TTL
    await BiometricChallenge.create({
      challenge: options.challenge,
      userId: user.userId,
      companyId: user.companyId,
      type: 'registration',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return options;
  }

  async verifyRegisterResponse(user, originHeader, hostHeader, response, deviceName) {
    const { rpID, expectedOrigins } = getRpInfo(originHeader, hostHeader);

    const challengeDoc = await BiometricChallenge.findOne({
      userId: user.userId,
      companyId: user.companyId,
      type: 'registration',
    }).sort({ createdAt: -1 });

    if (!challengeDoc) {
      const err = new Error('Biometric registration challenge expired or not found. Please try again.');
      err.statusCode = 400;
      throw err;
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeDoc.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      const err = new Error('Biometric registration verification failed.');
      err.statusCode = 400;
      throw err;
    }

    // Clean up single-use challenge
    await BiometricChallenge.deleteOne({ _id: challengeDoc._id });

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;

    const newCred = await BiometricCredential.create({
      credentialId: credential.id,
      userId: user.userId,
      companyId: user.companyId,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceType: credentialDeviceType || 'singleDevice',
      backedUp: Boolean(credentialBackedUp),
      transports: response.response?.transports || credential.transports || [],
      deviceName: deviceName || 'This Device',
      aaguid: aaguid || '',
      isActive: true,
      lastUsedAt: new Date(),
    });

    return {
      verified: true,
      credentialId: newCred.credentialId,
      deviceName: newCred.deviceName,
    };
  }

  async generateAuthOptions(companyId, userId, originHeader, hostHeader, customBusinessName) {
    let businessName = customBusinessName;
    if (!businessName && companyId) {
      try {
        const comp = await companyRepository.findById(companyId);
        if (comp && comp.businessName) {
          businessName = comp.businessName;
        }
      } catch (err) {
        logger.warn('Could not lookup company for biometric auth options: %s', err?.message);
      }
    }

    const { rpID, rpName } = getRpInfo(originHeader, hostHeader, businessName);

    const activeCreds = await BiometricCredential.find({
      companyId,
      userId,
      isActive: true,
    });

    if (!activeCreds || activeCreds.length === 0) {
      const err = new Error('No biometric authentication enrolled for this profile on this device.');
      err.statusCode = 404;
      throw err;
    }

    const allowCredentials = activeCreds.map((c) => ({
      id: c.credentialId,
      transports: c.transports,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Provide rpName metadata for client display & title synchronization
    options.rpName = rpName;

    // Save challenge
    await BiometricChallenge.create({
      challenge: options.challenge,
      userId,
      companyId,
      type: 'authentication',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    return options;
  }

  async verifyAuthResponse(companyId, userId, originHeader, hostHeader, response) {
    const { rpID, expectedOrigins } = getRpInfo(originHeader, hostHeader);

    const credentialId = response.id;
    const credential = await BiometricCredential.findOne({
      credentialId,
      companyId,
      userId,
      isActive: true,
    });

    if (!credential) {
      const err = new Error('Biometric credential not recognized or has been revoked.');
      err.statusCode = 401;
      throw err;
    }

    const challengeDoc = await BiometricChallenge.findOne({
      userId,
      companyId,
      type: 'authentication',
    }).sort({ createdAt: -1 });

    if (!challengeDoc) {
      const err = new Error('Authentication challenge expired or invalid. Please try again.');
      err.statusCode = 400;
      throw err;
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeDoc.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      const err = new Error('Biometric verification failed.');
      err.statusCode = 401;
      throw err;
    }

    // Single-use challenge consumed
    await BiometricChallenge.deleteOne({ _id: challengeDoc._id });

    // Update credential state
    credential.counter = verification.authenticationInfo.newCounter;
    credential.lastUsedAt = new Date();
    await credential.save();

    // Resolve user & company
    const user = await userRepository.findById(userId);
    if (!user || user.companyId !== companyId) {
      const err = new Error('No user account found for this member.');
      err.statusCode = 404;
      throw err;
    }

    if (user.status === 'Inactive') {
      const err = new Error('This account has been disabled by the business Owner.');
      err.statusCode = 403;
      throw err;
    }

    const company = await companyRepository.findById(companyId);
    if (!company || !company.isActive) {
      const err = new Error('Your business account is suspended or inactive.');
      err.statusCode = 403;
      throw err;
    }

    if (!company.logo) {
      try {
        const Settings = (await import('../models/Settings.js')).default;
        const settingsDoc = await Settings.findOne({ companyId }).select('logo');
        if (settingsDoc && settingsDoc.logo) {
          company.logo = settingsDoc.logo;
        }
      } catch (e) {}
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user.userId,
      expiresAt,
    });

    return { user, company, accessToken, refreshToken };
  }

  async getBiometricStatus(companyId, userId) {
    const count = await BiometricCredential.countDocuments({
      companyId,
      userId,
      isActive: true,
    });
    return {
      enrolled: count > 0,
      count,
    };
  }

  async listUserCredentials(userId, companyId) {
    const creds = await BiometricCredential.find({
      userId,
      companyId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return creds.map((c) => ({
      id: c._id,
      credentialId: c.credentialId,
      deviceName: c.deviceName,
      deviceType: c.deviceType,
      backedUp: c.backedUp,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
    }));
  }

  async revokeCredential(userId, companyId, credentialId) {
    const result = await BiometricCredential.deleteOne({
      $or: [{ _id: credentialId }, { credentialId }],
      userId,
      companyId,
    });

    if (result.deletedCount === 0) {
      const err = new Error('Credential not found or not authorized to revoke.');
      err.statusCode = 404;
      throw err;
    }

    return { success: true, message: 'Biometric credential revoked successfully.' };
  }
}

const biometricService = new BiometricService();
export default biometricService;
