import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

router.get('/', NotificationController.list);
router.post('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markRead);
router.put('/:id/read', NotificationController.markRead);
router.delete('/:id', NotificationController.delete);

export default router;
