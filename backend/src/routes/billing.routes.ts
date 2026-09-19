import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', BillingController.list);
router.get('/:id', BillingController.getById);
router.post('/', BillingController.create);
router.put('/:id', BillingController.update);
router.delete('/:id', BillingController.delete);
router.post('/:id/pay', BillingController.collectPayment);

export default router;
