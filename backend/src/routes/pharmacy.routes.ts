import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacy.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get(['/medicines', '/inventory', '/'], PharmacyController.list);
router.post(['/medicines', '/inventory', '/'], PharmacyController.create);
router.put(['/medicines/:id', '/inventory/:id'], PharmacyController.update);
router.patch(['/medicines/:id/stock', '/inventory/:id/stock'], PharmacyController.updateStock);
router.delete(['/medicines/:id', '/inventory/:id'], PharmacyController.delete);

export default router;
