import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import { registerClinicSchema, loginSchema } from '../schemas/auth.schema';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.post('/register', validateRequest(registerClinicSchema), AuthController.registerClinic);
router.post('/register-clinic', validateRequest(registerClinicSchema), AuthController.registerClinic);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/request-otp', AuthController.requestOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/google', AuthController.googleAuth);
router.get('/google', AuthController.googleRedirect);
router.get('/google/callback', AuthController.googleCallback);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', authenticateToken, enforceTenantIsolation, AuthController.me);
router.post('/change-password', authenticateToken, enforceTenantIsolation, AuthController.changePassword);
router.post('/logout', authenticateToken, AuthController.logout);

export default router;
