import authService from '../services/authService.js';
import logger from '../config/logger.js';

const COOKIE_NAME = 'agribiz_refresh_token';

const setRefreshTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

class AuthController {
  async register(req, res, next) {
    try {
      logger.info('Register request received for business: %s', req.body.businessName);
      const { user, company, accessToken, refreshToken } = await authService.register(req.body);
      
      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        success: true,
        message: 'Business registered successfully!',
        accessToken,
        refreshToken,
        user: {
          id: user.userId,
          companyId: user.companyId,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          status: user.status,
          presenceStatus: user.presenceStatus || 'online',
          createdAt: user.createdAt,
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
          plan: company.plan,
          subscriptionStatus: company.subscriptionStatus,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { mobile, password, role } = req.body;
      logger.info('Login request received for mobile: %s, role: %s', mobile, role);
      const { user, company, accessToken, refreshToken } = await authService.login(mobile, password, role);

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        accessToken,
        refreshToken,
        user: {
          id: user.userId,
          companyId: user.companyId,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
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
          plan: company.plan,
          subscriptionStatus: company.subscriptionStatus,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const token = req.body.refreshToken || req.headers['x-refresh-token'] || req.cookies[COOKIE_NAME];
      if (!token) {
        logger.warn('Refresh request missing refresh token');
        return res.status(401).json({ success: false, message: 'Refresh token is missing.' });
      }

      logger.info('Token refresh requested');
      const { user, company, accessToken, refreshToken } = await authService.refresh(token);

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.userId,
          companyId: user.companyId,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
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
          plan: company.plan,
          subscriptionStatus: company.subscriptionStatus,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.cookies[COOKIE_NAME];
      logger.info('Logout requested');
      await authService.logout(token);
      
      res.clearCookie(COOKIE_NAME);
      res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { mobile, password } = req.body;
      logger.info('Password reset requested for mobile: %s', mobile);
      await authService.resetPassword(mobile, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully! You can now log in.'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
