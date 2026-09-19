import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';
import { requirePermission } from '../middlewares/rbac';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', PatientController.list);
router.post('/', PatientController.create);
router.get('/:id', PatientController.getById);
router.put('/:id', PatientController.update);
router.post('/:id/documents', PatientController.addDocument);
router.delete('/:id', PatientController.archive);

export default router;
