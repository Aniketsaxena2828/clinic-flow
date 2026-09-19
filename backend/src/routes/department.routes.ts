import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', DepartmentController.list);
router.post('/', DepartmentController.create);

export default router;
