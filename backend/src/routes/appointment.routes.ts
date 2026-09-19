import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', AppointmentController.list);
router.post('/', AppointmentController.book);
router.patch('/:id/status', AppointmentController.updateStatus);
router.put('/:id/reschedule', AppointmentController.reschedule);

export default router;
