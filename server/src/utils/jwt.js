import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const REFRESH_TOKEN_DAYS = 20;
export const REFRESH_TOKEN_EXPIRES_IN = `${REFRESH_TOKEN_DAYS}d`;
export const REFRESH_TOKEN_MS = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000; // 20 days in ms

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      companyId: user.companyId,
      role: user.role,
      name: user.name || user.role || 'User',
      customPermissions: user.customPermissions || [],
    },
    process.env.JWT_SECRET || 'agribiz_access_token_secret_key_12345',
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET || 'agribiz_refresh_token_secret_key_67890',
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'agribiz_access_token_secret_key_12345');
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'agribiz_refresh_token_secret_key_67890');
};
