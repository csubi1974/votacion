import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

/**
 * JWT Authentication middleware
 */
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Super admin-only authorization middleware
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Organization-scoped authorization middleware
 */
export const requireOrganizationAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const organizationId = req.params.organizationId || req.body.organizationId;
  
  if (req.user.role === 'super_admin') {
    // Super admin can access any organization
    return next();
  }

  if (organizationId && organizationId !== req.user.organizationId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this organization',
    });
  }

  next();
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (user && !user.isLocked()) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        };
      }
    }

    next();
  } catch {
    next();
  }
};

export default {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireOrganizationAccess,
  optionalAuth,
};