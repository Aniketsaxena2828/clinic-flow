import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', DoctorController.list);
router.post('/', DoctorController.create);
router.get('/:id', DoctorController.getById);
router.put('/:id', DoctorController.update);
router.delete('/:id', DoctorController.delete);

export default router;
