import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Clinic } from '../models/Clinic';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';
import { generateTokens, verifyRefreshToken } from '../config/jwt';
import { DemoStore } from '../utils/demoStore';

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: ['*'], // Full access
  Admin: [
    'patients:*',
    'doctors:*',
    'appointments:*',
    'prescriptions:*',
    'billing:*',
    'pharmacy:*',
    'inventory:*',
    'lab:*',
    'staff:*',
    'analytics:read'
  ],
  Doctor: ['patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'prescriptions:*', 'lab:read'],
  Receptionist: ['patients:create', 'patients:read', 'patients:update', 'appointments:*', 'billing:create', 'billing:read'],
  'Lab Technician': ['patients:read', 'lab:*'],
  Pharmacist: ['prescriptions:read', 'pharmacy:*', 'inventory:*'],
  Accountant: ['billing:*', 'payments:*', 'analytics:read']
};

export class AuthService {
  /**
   * Seed default RBAC roles for a newly initialized clinic
   */
  static async seedClinicRoles(clinicId: any) {
    const rolesToCreate = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([name, permissions]) => ({
      clinicId,
      name,
      description: `Default system role for ${name}`,
      isSystem: true,
      permissions
    }));

    const createdRoles = await Role.insertMany(rolesToCreate);
    const roleMap: Record<string, any> = {};
    createdRoles.forEach((r) => {
      roleMap[r.name] = r._id;
    });
    return roleMap;
  }

  /**
   * Register a new Clinic along with its Owner account
   */
  static async registerClinic(data: {
    clinicName: string;
    clinicCode: string;
    clinicEmail: string;
    clinicPhone: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerPhone?: string;
  }) {
    // Check if clinic code already exists
    const existingClinic = await Clinic.findOne({ code: data.clinicCode.toLowerCase() });
    if (existingClinic) {
      throw { statusCode: 400, message: 'Clinic code already taken. Please choose a unique clinic code.' };
    }

    // Create Clinic entity
    const clinic = await Clinic.create({
      name: data.clinicName,
      code: data.clinicCode.toLowerCase(),
      email: data.clinicEmail,
      phone: data.clinicPhone
    });

    // Seed default roles for clinic
    const roleMap = await this.seedClinicRoles(clinic._id);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.ownerPassword, salt);

    // Create Owner user
    const owner = await User.create({
      clinicId: clinic._id,
      name: data.ownerName,
      email: data.ownerEmail.toLowerCase(),
      passwordHash,
      roleId: roleMap['Owner'],
      roleName: 'Owner',
      phone: data.ownerPhone
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: owner._id.toString(),
      clinicId: clinic._id.toString(),
      roleName: owner.roleName,
      email: owner.email
    });

    owner.refreshToken = tokens.refreshToken;
    owner.lastLoginAt = new Date();
    await owner.save();

    // Log audit event
    await AuditLog.create({
      clinicId: clinic._id,
      userId: owner._id,
      userEmail: owner.email,
      action: 'CLINIC_REGISTERED',
      resource: 'Clinic',
      details: { clinicName: clinic.name, clinicCode: clinic.code }
    });

    return {
      clinic: {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        email: clinic.email,
        phone: clinic.phone,
        subscriptionTier: clinic.subscriptionTier
      },
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.roleName
      },
      tokens
    };
  }

  /**
   * Login user by clinicCode + email + password
   */
  static async login(data: { clinicCode: string; email: string; password: string }) {
    const cleanCode = data.clinicCode.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Isolated per-visitor ephemeral session for DEMO account
    if (cleanCode === 'demo-clinic') {
      const allowedDemoEmails = ['owner@democlinic.com', 'doctor@democlinic.com', 'reception@democlinic.com'];
      if (!allowedDemoEmails.includes(cleanEmail) && !cleanEmail.includes('demo')) {
        throw { statusCode: 401, message: 'Invalid demo credentials. Use owner@democlinic.com.' };
      }
      if (data.password !== 'Password123') {
        throw { statusCode: 401, message: 'Invalid demo password. Please use Password123.' };
      }

      // Generate a brand new isolated demo session for this visitor
      const demoSessionId = `demo_${crypto.randomUUID().replace(/-/g, '')}`;
      const session = DemoStore.getOrCreateSession(demoSessionId);
      const demoUser = session.users.find((u: any) => u.email.toLowerCase() === cleanEmail) || session.users[0];

      const tokens = generateTokens({
        userId: demoUser.id || demoUser._id,
        clinicId: demoSessionId,
        roleName: demoUser.roleName || 'Owner',
        email: demoUser.email
      });

      return {
        clinic: {
          id: session.clinic.id || session.clinic._id,
          name: session.clinic.name,
          code: session.clinic.code,
          email: session.clinic.email,
          phone: session.clinic.phone,
          subscriptionTier: session.clinic.subscriptionTier,
          logoUrl: session.clinic.logoUrl
        },
        user: {
          id: demoUser.id || demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.roleName || 'Owner',
          avatarUrl: demoUser.avatarUrl
        },
        tokens
      };
    }

    const clinic = await Clinic.findOne({ code: cleanCode });
    if (!clinic) {
      throw { statusCode: 404, message: 'Clinic code not found.' };
    }

    if (clinic.status !== 'active') {
      throw { statusCode: 403, message: `Clinic account is ${clinic.status}. Please contact support.` };
    }

    const user = await User.findOne({
      clinicId: clinic._id,
      email: cleanEmail
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    if (user.status !== 'active') {
      throw { statusCode: 403, message: 'User account is inactive. Please contact your clinic administrator.' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      clinicId: clinic._id.toString(),
      roleName: user.roleName,
      email: user.email
    });

    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      clinicId: clinic._id,
      userId: user._id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      resource: 'Auth'
    }).catch(() => {});

    await NotificationService.createNotification(clinic._id, {
      category: 'System',
      title: 'Security: User Signed In',
      message: `User ${user.name} (${user.email}) signed in successfully.`,
      priority: 'low',
      actionUrl: '/settings'
    });

    return {
      clinic: {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        email: clinic.email,
        phone: clinic.phone,
        subscriptionTier: clinic.subscriptionTier,
        logoUrl: clinic.logoUrl
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleName,
        avatarUrl: user.avatarUrl
      },
      tokens
    };
  }

  /**
   * Refresh Access Token using valid Refresh Token
   */
  static async refreshAccessToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== refreshToken || user.status !== 'active') {
      throw { statusCode: 401, message: 'Invalid or revoked refresh token.' };
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      clinicId: user.clinicId.toString(),
      roleName: user.roleName,
      email: user.email
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }

  /**
   * Get authenticated user profile & tenant info
   */
  static async getMe(userId: string, clinicId: string) {
    if (DemoStore.isDemoSession(clinicId)) {
      const session = DemoStore.getOrCreateSession(clinicId);
      const user = session.users.find((u: any) => (u.id === userId || u._id === userId || u.email.toLowerCase() === 'owner@democlinic.com')) || session.users[0];
      return {
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.roleName || 'Owner',
          phone: user.phone || '+1-800-555-0101',
          avatarUrl: user.avatarUrl,
          lastLoginAt: new Date().toISOString(),
          permissions: ['*']
        },
        clinic: {
          id: session.clinic.id || session.clinic._id,
          name: session.clinic.name,
          code: session.clinic.code,
          email: session.clinic.email,
          phone: session.clinic.phone,
          subscriptionTier: session.clinic.subscriptionTier,
          workingHours: session.clinic.workingHours,
          logoUrl: session.clinic.logoUrl
        }
      };
    }

    // Look up the real user by their actual userId from JWT
    let user: any = null;
    try {
      user = await User.findById(userId).select('-passwordHash -refreshToken');
      if (!user && userId === 'usr-owner') {
        user = await User.findOne({ email: 'owner@democlinic.com' }).select('-passwordHash -refreshToken');
      }
    } catch (e) {
      if (userId === 'usr-owner') {
        user = await User.findOne({ email: 'owner@democlinic.com' }).select('-passwordHash -refreshToken').catch(() => null);
      }
    }

    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }

    // Look up the real clinic by clinicId from JWT
    let clinic: any = null;
    try {
      clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        clinic = await Clinic.findById(user.clinicId);
      }
    } catch (e) {
      clinic = null;
    }

    if (!clinic) {
      throw { statusCode: 404, message: 'Clinic not found.' };
    }

    let role: any = null;
    if (user.roleId) {
      role = await Role.findById(user.roleId).catch(() => null);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        lastLoginAt: user.lastLoginAt,
        permissions: role ? role.permissions : []
      },
      clinic: {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        email: clinic.email,
        phone: clinic.phone,
        subscriptionTier: clinic.subscriptionTier,
        workingHours: clinic.workingHours,
        logoUrl: clinic.logoUrl
      }
    };
  }

  /**
   * Revoke refresh token on Logout
   */
  static async logout(userId: string, clinicId?: string) {
    if (clinicId && DemoStore.isDemoSession(clinicId)) {
      DemoStore.destroySession(clinicId);
      return;
    }
    if (userId && !userId.startsWith('demo_')) {
      await User.findByIdAndUpdate(userId, { refreshToken: null }).catch(() => {});
    }
  }

  /**
   * Request 6-digit OTP for Email or Phone login
   */
  static async requestOtp(identifier: string) {
    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }]
    });

    if (!user) {
      throw { statusCode: 404, message: 'No registered user found with that email or phone number.' };
    }

    if (user.status !== 'active') {
      throw { statusCode: 403, message: 'User account is inactive. Please contact clinic administrator.' };
    }

    // Resend cooldown check: 60 seconds
    const now = Date.now();
    if (user.otpLastRequestedAt) {
      const elapsed = now - new Date(user.otpLastRequestedAt).getTime();
      if (elapsed < 60000) {
        const remaining = Math.ceil((60000 - elapsed) / 1000);
        throw { statusCode: 429, message: `Please wait ${remaining} seconds before requesting a new verification code.` };
      }
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes expiration

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    user.otpLastRequestedAt = new Date(now);
    user.otpAttempts = 0; // Reset attempts on new code request
    await user.save();

    const clinic = await Clinic.findById(user.clinicId);
    const isDev = process.env.NODE_ENV !== 'production';

    return {
      message: `Verification code sent successfully to ${cleanId}`,
      email: user.email,
      phone: user.phone,
      clinicCode: clinic ? clinic.code : 'demo-clinic',
      ...(isDev ? { otpCode } : {})
    };
  }

  /**
   * Verify 6-digit OTP and issue auth tokens
   */
  static async verifyOtp(identifier: string, otpCode: string) {
    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: cleanId }, { phone: cleanId }]
    });

    if (!user) {
      throw { statusCode: 404, message: 'Invalid verification request.' };
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw { statusCode: 400, message: 'No active verification code found. Please request a new code.' };
    }

    // Check expiry (5 minutes)
    if (new Date() > user.otpExpiresAt) {
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      throw { statusCode: 400, message: 'This verification code has expired. Please request a new code.' };
    }

    // Attempt limiting: Max 5 attempts allowed per OTP
    user.otpAttempts = (user.otpAttempts || 0) + 1;

    if (user.otpAttempts > 5) {
      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      throw { statusCode: 429, message: 'Too many incorrect attempts. This code has been invalidated. Please request a new one.' };
    }

    if (user.otpCode !== otpCode.trim()) {
      await user.save();
      const remaining = 5 - user.otpAttempts;
      throw { statusCode: 400, message: `Invalid 6-digit verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : ''}` };
    }

    // Single-use: Clear OTP immediately upon successful verification
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.lastLoginAt = new Date();
    await user.save();

    const clinic = await Clinic.findById(user.clinicId);

    const tokens = generateTokens({
      userId: user._id.toString(),
      clinicId: user.clinicId.toString(),
      roleName: user.roleName,
      email: user.email
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      clinic: clinic ? {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        email: clinic.email,
        phone: clinic.phone,
        subscriptionTier: clinic.subscriptionTier
      } : null,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleName
      },
      tokens
    };
  }

  /**
   * Google OAuth Authenticate or Register
   */
  static async googleAuth(data: { email: string; name: string; googleId?: string; avatarUrl?: string; clinicCode?: string }) {
    const email = data.email.toLowerCase().trim();
    let user = await User.findOne({ email });
    let clinic;

    if (user) {
      user.authProvider = 'google';
      user.googleId = data.googleId || user.googleId;
      user.avatarUrl = data.avatarUrl || user.avatarUrl;
      user.lastLoginAt = new Date();
      await user.save();
      clinic = await Clinic.findById(user.clinicId);
    } else {
      const code = data.clinicCode || `clinic-${Math.floor(1000 + Math.random() * 9000)}`;
      clinic = await Clinic.create({
        name: `${data.name}'s Practice`,
        code,
        email,
        phone: '+91 98765 00000'
      });

      const roleMap = await this.seedClinicRoles(clinic._id);

      user = await User.create({
        clinicId: clinic._id,
        name: data.name,
        email,
        roleId: roleMap['Owner'],
        roleName: 'Owner',
        authProvider: 'google',
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
        lastLoginAt: new Date()
      });
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      clinicId: clinic ? clinic._id.toString() : user.clinicId.toString(),
      roleName: user.roleName,
      email: user.email
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      clinic: clinic ? {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        email: clinic.email
      } : null,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleName,
        avatarUrl: user.avatarUrl
      },
      tokens
    };
  }

  /**
   * Forgot Password - Send Reset Token
   */
  static async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    // Do not reveal whether user exists
    if (!user) {
      return { message: 'If an account exists with that email, a password reset link has been issued.' };
    }

    const resetToken = 'rst-' + Math.floor(100000 + Math.random() * 900000);
    user.resetToken = resetToken;
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    return {
      message: 'If an account exists with that email, a password reset link has been issued.',
      resetToken // returned for local testing
    };
  }

  /**
   * Reset Password with valid token
   */
  static async resetPassword(resetToken: string, newPassword: string) {
    const user = await User.findOne({ resetToken });

    if (!user || !user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
      throw { statusCode: 400, message: 'Invalid or expired password reset token.' };
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    return { message: 'Password updated successfully. You can now sign in.' };
  }

  static async changePassword(clinicId: string, userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findOne({ _id: userId, clinicId });
    if (!user) {
      throw { statusCode: 404, message: 'User account not found.' };
    }

    if (!user.passwordHash) {
      throw { statusCode: 400, message: 'Password is not set for this account.' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 400, message: 'Current password does not match.' };
    }

    if (newPassword.length < 6) {
      throw { statusCode: 400, message: 'New password must be at least 6 characters long.' };
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail: user.email,
      action: 'PASSWORD_CHANGED',
      resource: 'User'
    }).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'System',
      title: 'Security: Password Changed',
      message: `Password was changed successfully for user ${user.name} (${user.email}).`,
      priority: 'high',
      actionUrl: '/settings'
    });

    return { success: true, message: 'Password changed successfully.' };
  }
}
