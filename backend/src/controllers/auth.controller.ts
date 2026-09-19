import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async registerClinic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.registerClinic(req.body);

      // Set httpOnly refresh cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'Clinic registered successfully!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Logged in successfully!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token is required.' });
        return;
      }

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = await AuthService.getMe(req.user.userId, req.user.clinicId);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.clinicId || req.user?.userId) {
        await AuthService.logout(req.user?.userId || '', req.clinicId);
      }
      res.clearCookie('refreshToken');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'Email or phone number is required.' });
        return;
      }
      const result = await AuthService.requestOtp(identifier);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, otpCode } = req.body;
      if (!identifier || !otpCode) {
        res.status(400).json({ success: false, message: 'Identifier and OTP code are required.' });
        return;
      }
      const result = await AuthService.verifyOtp(identifier, otpCode);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({ success: true, message: 'OTP verified successfully.', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async googleRedirect(req: Request, res: Response): Promise<void> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const clinicCode = (req.query.clinicCode as string) || '';

    if (!clientId) {
      res.status(501).json({
        success: false,
        message: 'Google OAuth is not configured. Required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in backend/.env'
      });
      return;
    }

    const state = encodeURIComponent(clinicCode);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=consent`;
    res.redirect(authUrl);
  }

  static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state } = req.query;
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      if (!code) {
        res.redirect(`${clientUrl}/login?error=Google authentication was cancelled`);
        return;
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

      if (!clientId || !clientSecret) {
        res.redirect(`${clientUrl}/login?error=Google OAuth configuration missing`);
        return;
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenData.access_token) {
        res.redirect(`${clientUrl}/login?error=Failed to exchange Google auth code`);
        return;
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile: any = await userRes.json();

      if (!profile.email) {
        res.redirect(`${clientUrl}/login?error=Failed to retrieve email from Google`);
        return;
      }

      const result = await AuthService.googleAuth({
        email: profile.email,
        name: profile.name || 'Google User',
        googleId: profile.sub,
        avatarUrl: profile.picture,
        clinicCode: state ? decodeURIComponent(state as string) : undefined
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.redirect(`${clientUrl}/login?token=${result.tokens.accessToken}&clinicCode=${result.clinic?.code || ''}`);
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!process.env.GOOGLE_CLIENT_ID && !req.body.email) {
        res.status(400).json({
          success: false,
          message: 'Google Sign-In is not configured. Required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET in backend/.env'
        });
        return;
      }

      const result = await AuthService.googleAuth(req.body);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({ success: true, message: 'Google authentication successful.', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required.' });
        return;
      }
      const result = await AuthService.forgotPassword(email);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
        return;
      }
      const result = await AuthService.resetPassword(resetToken, newPassword);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current password and new password are required.' });
        return;
      }
      const result = await AuthService.changePassword(
        req.clinicId!,
        req.user!.userId,
        currentPassword,
        newPassword
      );
      res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to change password.' });
    }
  }
}
