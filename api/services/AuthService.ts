import { User } from '../models/User.js';
import { validateRut } from '../utils/rutValidator.js';
import { hashPassword, comparePassword, generateEmailVerificationToken } from '../utils/security.js';
import { generateTokenPair } from '../utils/jwt.js';
import * as speakeasy from 'speakeasy';
import { AuditService } from './AuditService.js';

export interface LoginData {
  rut?: string;
  email?: string;
  password: string;
  recaptchaToken?: string;
}

export interface RegisterData {
  rut: string;
  email: string;
  password: string;
  fullName: string;
  organizationId: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: { id: string; rut?: string; email: string; fullName: string; role?: string; organizationId?: string; organizationName?: string; emailVerified?: boolean; twoFactorEnabled?: boolean };
  tokens?: { accessToken: string; refreshToken: string };
  requires2FA?: boolean;
}

/**
 * Authentication service for handling user login, registration, and 2FA
 */
export class AuthService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Validate RUT format
   */
  private validateRutFormat(rut: string): boolean {
    return validateRut(rut);
  }

  /**
   * Validate email format
   */
  private validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true, message: 'Password is valid' };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validate RUT format
      if (!this.validateRutFormat(data.rut)) {
        return {
          success: false,
          message: 'Invalid RUT format. Please use format: 12.345.678-9',
        };
      }

      // Validate email format
      if (!this.validateEmailFormat(data.email)) {
        return {
          success: false,
          message: 'Invalid email format',
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message,
        };
      }

      // Check if RUT already exists
      const existingUserByRut = await User.findOne({ where: { rut: data.rut } });
      if (existingUserByRut) {
        return {
          success: false,
          message: 'RUT already registered',
        };
      }

      // Check if email already exists
      const existingUserByEmail = await User.findOne({ where: { email: data.email } });
      if (existingUserByEmail) {
        return {
          success: false,
          message: 'Email already registered',
        };
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Generate email verification token
      const emailVerificationToken = generateEmailVerificationToken();

      // In development, auto-verify emails
      const isDevelopment = process.env.NODE_ENV !== 'production';

      // Create user
      const user = await User.create({
        rut: data.rut,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        organizationId: data.organizationId,
        emailVerified: isDevelopment, // Auto-verify in development
      });

      // TODO: Send email verification email
      if (isDevelopment) {
        console.log(`✅ Development mode: Email auto-verified for ${data.email}`);
      } else {
        console.log(`Email verification token for ${data.email}: ${emailVerificationToken}`);
      }

      return {
        success: true,
        message: isDevelopment
          ? 'User registered successfully. You can now login.'
          : 'User registered successfully. Please verify your email to continue.',
        user: {
          id: user.id,
          rut: user.rut,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData, ipAddress: string = '0.0.0.0'): Promise<AuthResponse> {
    try {
      let user: User | null = null;

      // In development, allow login by email for testing convenience
      if (data.email && process.env.NODE_ENV === 'development') {
        user = await User.findOne({ where: { email: data.email } });
      } else {
        // Validate RUT format
        if (!data.rut || !this.validateRutFormat(data.rut)) {
          return {
            success: false,
            message: 'Invalid RUT format. Please use format: 12.345.678-9',
          };
        }
        // Find user by RUT
        user = await User.findOne({ where: { rut: data.rut } });
      }

      if (!user) {
        // Log failed login attempt
        await this.auditService.logActivity({
          userId: 'unknown',
          action: 'LOGIN_FAILED',
          resourceType: 'user',
          resourceId: undefined,
          oldValues: null,
          newValues: { rut: data.rut || data.email, reason: 'User not found' },
          ipAddress,
        });

        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Check if account is locked
      if (user.isLocked()) {
        // Log account locked attempt
        await this.auditService.logActivity({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          resourceType: 'user',
          resourceId: user.id,
          oldValues: null,
          newValues: { lockedUntil: user.lockedUntil },
          ipAddress,
        });

        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        };
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.passwordHash);
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.incrementFailedAttempts();
        await user.save();

        // Log failed login
        await this.auditService.logActivity({
          userId: user.id,
          action: 'LOGIN_FAILED',
          resourceType: 'user',
          resourceId: user.id,
          oldValues: null,
          newValues: {
            reason: 'Invalid password',
            failedAttempts: user.failedLoginAttempts
          },
          ipAddress,
        });

        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      // Reset failed login attempts on successful login
      user.resetFailedAttempts();
      await user.save();

      // Check if email is verified
      if (!user.emailVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the verification email.',
        };
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        return {
          success: true,
          message: '2FA verification required',
          requires2FA: true,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        };
      }

      // Generate tokens
      const tokens = generateTokenPair(user);

      // Get organization name
      const { Organization } = await import('../models/Organization.js');
      const organization = await Organization.findByPk(user.organizationId);

      // Log successful login
      await this.auditService.logActivity({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resourceType: 'user',
        resourceId: user.id,
        oldValues: null,
        newValues: { role: user.role, organizationId: user.organizationId },
        ipAddress,
      });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          rut: user.rut,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: organization?.name,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(userId: string, code: string): Promise<AuthResponse> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return {
          success: false,
          message: '2FA is not enabled for this user',
        };
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2, // Allow 2 time steps of drift
      });

      if (!verified) {
        return {
          success: false,
          message: 'Invalid 2FA code',
        };
      }

      // Generate tokens
      const tokens = generateTokenPair(user);

      // Get organization name
      const { Organization } = await import('../models/Organization.js');
      const organization = await Organization.findByPk(user.organizationId);

      return {
        success: true,
        message: '2FA verification successful',
        user: {
          id: user.id,
          rut: user.rut,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: organization?.name,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens,
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      return {
        success: false,
        message: '2FA verification failed. Please try again.',
      };
    }
  }

  /**
   * Setup 2FA for user
   */
  async setup2FA(userId: string): Promise<{ success: boolean; secret?: string; qrCode?: string; message: string }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Voting Platform (${user.email})`,
        issuer: 'Voting Platform',
      });

      // Update user with 2FA secret
      user.twoFactorSecret = secret.base32;
      await user.save();

      // Generate QR code URL
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: user.email,
        issuer: 'Voting Platform',
        encoding: 'ascii',
      });

      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        message: '2FA setup initiated. Please scan the QR code with your authenticator app.',
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return {
        success: false,
        message: '2FA setup failed. Please try again.',
      };
    }
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.twoFactorSecret) {
        return {
          success: false,
          message: '2FA setup not initiated',
        };
      }

      // Verify the setup code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });

      if (!verified) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      // Enable 2FA
      user.twoFactorEnabled = true;
      await user.save();

      return {
        success: true,
        message: '2FA enabled successfully',
      };
    } catch (error) {
      console.error('Enable 2FA error:', error);
      return {
        success: false,
        message: 'Failed to enable 2FA',
      };
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password',
        };
      }

      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      await user.save();

      return {
        success: true,
        message: '2FA disabled successfully',
      };
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return {
        success: false,
        message: 'Failed to disable 2FA',
      };
    }
  }
}

export default new AuthService();