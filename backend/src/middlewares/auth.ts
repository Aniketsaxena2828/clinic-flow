import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { Clinic } from '../models/Clinic';
import { User } from '../models/User';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Fallback to cookie if present
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const payload = verifyAccessToken(token);
    let clinicId = payload.clinicId || (payload as any).clinic_id;

    if (!clinicId && payload.userId) {
      const user = await User.findById(payload.userId).catch(() => null);
      if (user && user.clinicId) {
        clinicId = user.clinicId.toString();
      }
    }

    if (!clinicId) {
      res.status(401).json({ success: false, message: 'Invalid session: Tenant clinic ID could not be determined.' });
      return;
    }

    req.user = {
      ...payload,
      clinicId: clinicId.toString()
    };
    req.clinicId = clinicId.toString();
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

