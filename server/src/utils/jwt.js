import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const REFRESH_TOKEN_DAYS = 20;
export const REFRESH_TOKEN_EXPIRES_IN = `${REFRESH_TOKEN_DAYS}d`;
export const REFRESH_TOKEN_MS = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000; // 20 days in ms

const getAccessTokenSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.');
    }
    return 'agribiz_access_token_secret_key_12345';
  }
  return secret;
};

const getRefreshTokenSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_REFRESH_SECRET environment variable is missing in production.');
    }
    return 'agribiz_refresh_token_secret_key_67890';
  }
  return secret;
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      companyId: user.companyId,
      role: user.role,
      name: user.name || user.role || 'User',
      customPermissions: user.customPermissions || [],
    },
    getAccessTokenSecret(),
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.userId, jti: crypto.randomUUID() },
    getRefreshTokenSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessTokenSecret());
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshTokenSecret());
};
