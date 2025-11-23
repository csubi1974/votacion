import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import DOMPurify from 'isomorphic-dompurify';
import crypto from 'crypto';

// CSRF token management
const csrfTokens = new Map<string, number>();
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 vote attempts per hour
  message: 'Too many vote attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for authenticated requests with valid tokens
    return !!req.headers.authorization;
  }
});

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Generate CSRF token
export const generateCSRFToken = (): string => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now() + TOKEN_EXPIRY);
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
};

// Clean up expired CSRF tokens
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, expiry] of csrfTokens.entries()) {
    if (expiry < now) {
      csrfTokens.delete(token);
    }
  }
};

// Validate CSRF token
export const validateCSRFToken = (token: string): boolean => {
  const expiry = csrfTokens.get(token);
  if (!expiry) return false;
  
  if (expiry < Date.now()) {
    csrfTokens.delete(token);
    return false;
  }
  
  // Token is valid, remove it (one-time use)
  csrfTokens.delete(token);
  return true;
};

// CSRF middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and authenticated API calls with valid tokens
  if (req.method === 'GET' || req.headers.authorization) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!token || !validateCSRFToken(token)) {
    return res.status(403).json({ 
      error: 'Invalid or missing CSRF token',
      code: 'CSRF_INVALID'
    });
  }
  
  next();
};

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj.trim());
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          (sanitized as Record<string, unknown>)[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body) as unknown as Record<string, unknown>;
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query) as unknown as Record<string, unknown>;
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params) as unknown as Record<string, unknown>;
  }
  
  next();
};

// XSS Protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi
  ];
  
  const checkForSuspiciousContent = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    if (Array.isArray(obj)) {
      return obj.some(item => checkForSuspiciousContent(item));
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj as Record<string, unknown>).some(value => checkForSuspiciousContent(value));
    }
    return false;
  };
  
  // Check body, query, and params for suspicious content
  const suspiciousSources: string[] = [];
  
  if (req.body && checkForSuspiciousContent(req.body)) {
    suspiciousSources.push('body');
  }
  
  if (req.query && checkForSuspiciousContent(req.query)) {
    suspiciousSources.push('query');
  }
  
  if (req.params && checkForSuspiciousContent(req.params)) {
    suspiciousSources.push('params');
  }
  
  if (suspiciousSources.length > 0) {
    return res.status(400).json({
      error: 'Suspicious content detected',
      code: 'SUSPICIOUS_CONTENT',
      sources: suspiciousSources
    });
  }
  
  next();
};

// Security audit logging
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const auditData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      userId: (req as Request & { user?: { id?: string } }).user?.id || null,
      suspicious: false
    };
    
    // Flag suspicious requests
    if (res.statusCode === 403 || res.statusCode === 429) {
      auditData.suspicious = true;
    }
    
    // Log security events
    if (auditData.suspicious || duration > 5000 || res.statusCode >= 400) {
      console.log('[SECURITY AUDIT]', JSON.stringify(auditData));
    }
  });
  
  next();
};

// File upload security
type UploadedFile = { mimetype: string; size: number; buffer: Buffer };
export const validateFileUpload = (req: Request & { file?: UploadedFile; files?: UploadedFile[] }, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const files = Array.isArray(req.files) ? req.files : [req.file];
  
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv'
  ];
  
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  
  for (const file of files) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        code: 'INVALID_FILE_TYPE',
        allowed: allowedMimeTypes
      });
    }
    
    if (file.size > maxFileSize) {
      return res.status(400).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: maxFileSize
      });
    }
    
    // Check for malicious file signatures
    const maliciousSignatures = [
      Buffer.from('3c3f786d6c', 'hex'), // <?xml
      Buffer.from('3c21444f4354595045', 'hex'), // <!DOCTYPE
      Buffer.from('3c21454e54495459', 'hex'), // <!ENTITY
      Buffer.from('3c3f706870', 'hex'), // <?php
      Buffer.from('252150532d41646f6265', 'hex'), // %!PS-Adobe
    ];
    
    const fileBuffer = file.buffer.slice(0, 20); // Check first 20 bytes
    const hasMaliciousSignature = maliciousSignatures.some(signature =>
      fileBuffer.includes(signature)
    );
    
    if (hasMaliciousSignature) {
      return res.status(400).json({
        error: 'Potentially malicious file detected',
        code: 'MALICIOUS_FILE'
      });
    }
  }
  
  next();
};

// IP whitelist/blacklist middleware
export const ipFilter = (allowedIPs: string[] = [], blockedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    if (blockedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_BLOCKED'
      });
    }
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

export default {
  authLimiter,
  generalLimiter,
  voteLimiter,
  securityHeaders,
  csrfProtection,
  sanitizeInput,
  xssProtection,
  validateInput,
  securityAudit,
  validateFileUpload,
  ipFilter,
  generateCSRFToken
};