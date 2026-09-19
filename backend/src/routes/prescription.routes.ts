import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', PrescriptionController.list);
router.post('/', PrescriptionController.create);
router.put('/:id', PrescriptionController.update);

export default router;
