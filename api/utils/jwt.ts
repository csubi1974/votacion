import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'voting-platform',
    audience: 'voting-platform-users',
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user: User): string => {
  const payload = {
    userId: user.id,
    tokenType: 'refresh',
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'voting-platform',
    audience: 'voting-platform-users',
  });
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'voting-platform',
      audience: 'voting-platform-users',
    }) as JWTPayload;
  } catch {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string; tokenType: string } => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'voting-platform',
      audience: 'voting-platform-users',
    }) as { userId: string; tokenType: string };
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (user: User): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return { accessToken, refreshToken };
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): unknown => {
  return jwt.decode(token);
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): number | null => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object') return null;
  const payload = decoded as JwtPayload;
  return payload.exp ? payload.exp * 1000 : null;
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  decodeToken,
  getTokenExpiration,
};