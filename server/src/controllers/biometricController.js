import biometricService from '../services/biometricService.js';
import logger from '../config/logger.js';

const COOKIE_NAME = 'agribiz_refresh_token';

const setRefreshTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

class BiometricController {
  async getStatus(req, res, next) {
    try {
      const { companyId, userId } = req.query;
      if (!companyId || !userId) {
        return res.status(400).json({ success: false, message: 'companyId and userId are required.' });
      }

      const status = await biometricService.getBiometricStatus(companyId, userId);
      res.status(200).json({ success: true, ...status });
    } catch (error) {
      next(error);
    }
  }

  async getRegisterOptions(req, res, next) {
    try {
      const origin = req.headers.origin;
      const host = req.headers.host;
      logger.info('Generating biometric registration options for user: %s', req.user.userId);

      const options = await biometricService.generateRegisterOptions(req.user, origin, host);
      res.status(200).json({ success: true, options });
    } catch (error) {
      next(error);
    }
  }

  async verifyRegister(req, res, next) {
    try {
      const origin = req.headers.origin;
      const host = req.headers.host;
      const { response, deviceName } = req.body;

      if (!response) {
        return res.status(400).json({ success: false, message: 'Registration response payload is required.' });
      }

      logger.info('Verifying biometric registration for user: %s', req.user.userId);
      const result = await biometricService.verifyRegisterResponse(req.user, origin, host, response, deviceName);

      res.status(200).json({
        success: true,
        message: 'Fingerprint / Biometric authentication successfully enabled on this device.',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuthOptions(req, res, next) {
    try {
      const { companyId, userId } = req.body;
      const origin = req.headers.origin;
      const host = req.headers.host;

      if (!companyId || !userId) {
        return res.status(400).json({ success: false, message: 'companyId and userId are required.' });
      }

      logger.info('Generating biometric auth options for userId: %s in company: %s', userId, companyId);
      const options = await biometricService.generateAuthOptions(companyId, userId, origin, host);

      res.status(200).json({ success: true, options });
    } catch (error) {
      next(error);
    }
  }

  async verifyAuth(req, res, next) {
    try {
      const { companyId, userId, response } = req.body;
      const origin = req.headers.origin;
      const host = req.headers.host;

      if (!companyId || !userId || !response) {
        return res.status(400).json({ success: false, message: 'companyId, userId, and response are required.' });
      }

      logger.info('Verifying biometric authentication for userId: %s in company: %s', userId, companyId);
      const { user, company, accessToken, refreshToken } = await biometricService.verifyAuthResponse(
        companyId,
        userId,
        origin,
        host,
        response
      );

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}! Authenticated with biometrics.`,
        accessToken,
        refreshToken,
        user: {
          id: user.userId,
          companyId: user.companyId,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          customPermissions: user.customPermissions,
          status: user.status,
          presenceStatus: user.presenceStatus || 'online',
          avatar: user.avatar,
          lastLogin: user.lastLogin,
        },
        company: {
          id: company.companyId,
          businessName: company.businessName,
          ownerName: company.ownerName,
          mobile: company.mobile,
          email: company.email,
          gstin: company.gstin,
          city: company.city,
          state: company.state,
          logo: company.logo || '',
          plan: company.plan,
          subscriptionStatus: company.subscriptionStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async listCredentials(req, res, next) {
    try {
      const creds = await biometricService.listUserCredentials(req.user.userId, req.user.companyId);
      res.status(200).json({ success: true, credentials: creds });
    } catch (error) {
      next(error);
    }
  }

  async revokeCredential(req, res, next) {
    try {
      const { id } = req.params;
      const result = await biometricService.revokeCredential(req.user.userId, req.user.companyId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

const biometricController = new BiometricController();
export default biometricController;
