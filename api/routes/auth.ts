import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import authService from '../services/AuthService.js';
import { authenticateToken } from '../middleware/auth.js';
import { Organization } from '../models/Organization.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('rut')
    .notEmpty()
    .withMessage('RUT is required')
    .matches(/^\d{1,3}(\.\d{3})*-[0-9kK]$/)
    .withMessage('Invalid RUT format. Use format: 12.345.678-9'),
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.\-_#])[A-Za-z\d@$!%*?&.\-_#]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be between 3 and 100 characters'),
  body('organizationId')
    .optional()
    .isUUID()
    .withMessage('Invalid organization ID format'),
], async (req, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    let { rut, email, password, fullName, organizationId } = req.body;

    // If no organizationId provided, find or create default organization
    if (!organizationId) {
      let defaultOrg = await Organization.findOne({
        where: { name: 'Default Organization' }
      });

      if (!defaultOrg) {
        // Create default organization
        defaultOrg = await Organization.create({
          name: 'Default Organization',
          rut: '00.000.000-0',
          email: 'default@example.com',
        });
      }

      organizationId = defaultOrg.id;
    } else {
      // Check if organization exists
      const organization = await Organization.findByPk(organizationId);
      if (!organization) {
        return res.status(400).json({
          success: false,
          message: 'Organization not found',
        });
      }
    }

    // Register user
    const result = await authService.register({
      rut,
      email,
      password,
      fullName,
      organizationId,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body()
    .custom((value) => {
      const hasRut = typeof value.rut === 'string' && /^\d{1,3}(\.\d{3})*-[0-9kK]$/.test(value.rut);
      const hasEmail = typeof value.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email);
      return hasRut || hasEmail;
    })
    .withMessage('Provide a valid RUT or email'),
], async (req, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { rut, email, password } = req.body;

    // Login user
    const result = await authService.login({ rut, email, password }, req.ip || '0.0.0.0');

    if (result.success) {
      if (result.requires2FA) {
        // Store user ID in session for 2FA verification
        req.session = req.session || {};
        req.session.pending2FA = { userId: result.user?.id };

        res.json({
          success: true,
          message: result.message,
          requires2FA: true,
          userId: result.user?.id,
        });
      } else {
        res.json(result);
      }
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
});

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify 2FA code
 * @access  Public (requires pending 2FA session)
 */
router.post('/verify-2fa', [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('code')
    .notEmpty()
    .withMessage('2FA code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits'),
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { userId, code } = req.body;

    // Verify 2FA
    const result = await authService.verify2FA(userId, code);

    if (result.success) {
      // Clear pending 2FA session
      if (req.session?.pending2FA) {
        delete req.session.pending2FA;
      }

      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: '2FA verification failed. Please try again.',
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post('/refresh', async (req, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Import jwt utils inside the function to avoid circular dependency
    const { verifyRefreshToken, generateTokenPair } = await import('../utils/jwt.js');

    // Verify refresh token and get user ID
    const { userId } = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const tokens = generateTokenPair(user);

    res.json({
      success: true,
      tokens,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
type SessionRequest = Request & { session?: { destroy: (cb: (err?: unknown) => void) => void; pending2FA?: { userId: string } } };
type AuthedRequest = Request & { user: { id: string } };
router.post('/logout', authenticateToken, async (req: SessionRequest, res: Response) => {
  try {
    const userId = (req as AuthedRequest).user?.id;

    // Log logout
    if (userId) {
      const { AuditService } = await import('../services/AuditService.js');
      const auditService = new AuditService();
      await auditService.logActivity({
        userId,
        action: 'LOGOUT',
        resourceType: 'user',
        resourceId: userId,
        oldValues: null,
        newValues: null,
        ipAddress: req.ip || '0.0.0.0',
      });
    }

    // Clear any session data
    if (req.session) {
      req.session.destroy((err?: unknown) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticateToken, async (req: AuthedRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: ['id', 'rut', 'email', 'fullName', 'role', 'organizationId', 'emailVerified', 'twoFactorEnabled', 'createdAt'],
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'rut'],
      }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    });
  }
});

/**
 * @route   POST /api/auth/setup-2fa
 * @desc    Setup 2FA for current user
 * @access  Private
 */
router.post('/setup-2fa', authenticateToken, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await authService.setup2FA(req.user!.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
    });
  }
});

/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable 2FA for current user
 * @access  Private
 */
router.post('/enable-2fa', authenticateToken, [
  body('code')
    .notEmpty()
    .withMessage('2FA code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits'),
], async (req: AuthedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { code } = req.body;
    const result = await authService.enable2FA(req.user!.id, code);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA',
    });
  }
});

/**
 * @route   POST /api/auth/disable-2fa
 * @desc    Disable 2FA for current user
 * @access  Private
 */
router.post('/disable-2fa', authenticateToken, [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
], async (req: AuthedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { password } = req.body;
    const result = await authService.disable2FA(req.user!.id, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required to change password'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
], async (req, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.id;
    const { fullName, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const updates: any = {};

    // Update full name if provided
    if (fullName && fullName !== user.fullName) {
      updates.fullName = fullName;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const { comparePassword } = await import('../utils/security.js');
      const isValidPassword = await comparePassword(currentPassword, user.passwordHash);

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta',
        });
      }

      const { hashPassword } = await import('../utils/security.js');
      updates.passwordHash = await hashPassword(newPassword);
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await user.update(updates);

      // Log audit event
      const { AuditService } = await import('../services/AuditService.js');
      const auditService = new AuditService();
      await auditService.logActivity({
        userId: user.id,
        action: 'PROFILE_UPDATED',
        resourceType: 'User',
        resourceId: user.id,
        oldValues: null,
        newValues: updates,
        ipAddress: req.ip || '',
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: {
          id: user.id,
          rut: user.rut,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil',
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
], async (req, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña.',
      });
    }

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Create password reset token (expires in 1 hour)
    const { PasswordResetToken } = await import('../models/PasswordResetToken.js');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user.id,
      token: hashedToken,
      expiresAt,
    });

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    console.log('\n=== PASSWORD RESET REQUEST ===');
    console.log(`User: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token expires at: ${expiresAt.toISOString()}`);
    console.log('=============================\n');

    // TODO: Send email with resetUrl
    // await sendPasswordResetEmail(user.email, resetUrl);

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña.',
      devOnly: {
        resetUrl,
        token: resetToken,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
], async (req, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { token, password } = req.body;

    // Hash the token to compare with database
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const { PasswordResetToken } = await import('../models/PasswordResetToken.js');
    const resetToken = await PasswordResetToken.findOne({
      where: {
        token: hashedToken,
        used: false,
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado',
      });
    }

    // Check if token is expired
    if (resetToken.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'El token ha expirado',
      });
    }

    // Find user
    const user = await User.findByPk(resetToken.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Hash new password
    const { hashPassword } = await import('../utils/security.js');
    const passwordHash = await hashPassword(password);

    // Update user password
    await user.update({ passwordHash });

    // Mark token as used
    await resetToken.update({ used: true });

    // Log audit event
    const { AuditService } = await import('../services/AuditService.js');
    const auditService = new AuditService();
    await auditService.logActivity({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'User',
      resourceId: user.id,
      oldValues: null,
      newValues: null,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear la contraseña',
    });
  }
});

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Generate 2FA secret and QR code
 * @access  Private
 */
router.post('/2fa/setup', authenticateToken, async (req, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA ya está activado',
      });
    }

    const speakeasy = await import('speakeasy');
    const secret = speakeasy.default.generateSecret({
      name: `Voting Platform (${user.email})`,
      length: 32,
    });

    // Guardar secreto temporalmente (no activar aún)
    await user.update({ twoFactorSecret: secret.base32 });

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: secret.otpauth_url,
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al configurar 2FA',
    });
  }
});

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Verify code and enable 2FA
 * @access  Private
 */
router.post('/2fa/enable', [
  authenticateToken,
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener 6 dígitos'),
], async (req, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.id;
    const { code } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA ya está activado',
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Primero debes configurar 2FA',
      });
    }

    // Verificar código
    const speakeasy = await import('speakeasy');
    const verified = speakeasy.default.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido',
      });
    }

    // Generar códigos de recuperación
    const crypto = await import('crypto');
    const recoveryCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Hashear códigos de recuperación
    const { hashPassword } = await import('../utils/security.js');
    const hashedCodes = await Promise.all(
      recoveryCodes.map(code => hashPassword(code))
    );

    // Activar 2FA
    await user.update({
      twoFactorEnabled: true,
      twoFactorRecoveryCodes: JSON.stringify(hashedCodes),
    });

    // Log audit
    const { AuditService } = await import('../services/AuditService.js');
    const auditService = new AuditService();
    await auditService.logActivity({
      userId: user.id,
      action: '2FA_ENABLED',
      resourceType: 'User',
      resourceId: user.id,
      oldValues: null,
      newValues: null,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      message: '2FA activado exitosamente',
      data: {
        recoveryCodes, // Solo se muestran una vez
      },
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar 2FA',
    });
  }
});

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', [
  authenticateToken,
  body('code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener 6 dígitos'),
  body('password')
    .optional()
    .notEmpty()
    .withMessage('Password is required'),
], async (req, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.id;
    const { code, password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA no está activado',
      });
    }

    let verified = false;

    // Verificar código 2FA si se proporciona
    if (code && user.twoFactorSecret) {
      const speakeasy = await import('speakeasy');
      verified = speakeasy.default.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });
    }

    // Si no se verificó con código, verificar con contraseña
    if (!verified && password) {
      const { comparePassword } = await import('../utils/security.js');
      verified = await comparePassword(password, user.passwordHash);
    }

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Código o contraseña inválidos',
      });
    }

    // Desactivar 2FA
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: null,
    });

    // Log audit
    const { AuditService } = await import('../services/AuditService.js');
    const auditService = new AuditService();
    await auditService.logActivity({
      userId: user.id,
      action: '2FA_DISABLED',
      resourceType: 'User',
      resourceId: user.id,
      oldValues: null,
      newValues: null,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      message: '2FA desactivado exitosamente',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar 2FA',
    });
  }
});

/**
 * @route   POST /api/auth/2fa/regenerate-codes
 * @desc    Regenerate recovery codes
 * @access  Private
 */
router.post('/2fa/regenerate-codes', [
  authenticateToken,
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener 6 dígitos'),
], async (req, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const userId = (req as any).user.id;
    const { code } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA no está activado',
      });
    }

    // Verificar código
    const speakeasy = await import('speakeasy');
    const verified = speakeasy.default.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido',
      });
    }

    // Generar nuevos códigos de recuperación
    const crypto = await import('crypto');
    const recoveryCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Hashear códigos
    const { hashPassword } = await import('../utils/security.js');
    const hashedCodes = await Promise.all(
      recoveryCodes.map(code => hashPassword(code))
    );

    await user.update({
      twoFactorRecoveryCodes: JSON.stringify(hashedCodes),
    });

    // Log audit
    const { AuditService } = await import('../services/AuditService.js');
    const auditService = new AuditService();
    await auditService.logActivity({
      userId: user.id,
      action: '2FA_RECOVERY_CODES_REGENERATED',
      resourceType: 'User',
      resourceId: user.id,
      oldValues: null,
      newValues: null,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      message: 'Códigos de recuperación regenerados',
      data: {
        recoveryCodes,
      },
    });
  } catch (error) {
    console.error('2FA regenerate codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al regenerar códigos',
    });
  }
});

export default router;