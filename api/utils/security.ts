import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Security utilities for encryption, hashing, and secure operations
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Encrypt sensitive data
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedText: string): string => {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encrypted = textParts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate JWT secret
 */
export const generateJWTSecret = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Generate vote verification hash
 */
export const generateVoteHash = (userId: string, electionId: string, timestamp: Date): string => {
  const data = `${userId}:${electionId}:${timestamp.getTime()}:${crypto.randomBytes(16).toString('hex')}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and sanitize input
 */
export const sanitizeInput = (input: string): string => {
  // Remove any potential script tags and dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Generate secure email verification token
 */
export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash email for privacy (use in logs)
 */
export const hashEmail = (email: string): string => {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 16);
};

/**
 * Rate limiting helpers
 */
export const generateRateLimitKey = (identifier: string, action: string): string => {
  return `rate_limit:${action}:${identifier}`;
};

export default {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
  generateSecureToken,
  generateJWTSecret,
  generateVoteHash,
  sanitizeHtml,
  sanitizeInput,
  generateEmailVerificationToken,
  hashEmail,
  generateRateLimitKey,
};