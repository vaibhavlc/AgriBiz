import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.userId, companyId: user.companyId, role: user.role },
    process.env.JWT_SECRET || 'agribiz_access_token_secret_key_12345',
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET || 'agribiz_refresh_token_secret_key_67890',
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'agribiz_access_token_secret_key_12345');
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'agribiz_refresh_token_secret_key_67890');
};
