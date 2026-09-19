import { Router } from 'express';
import { LabController } from '../controllers/lab.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get(['/orders', '/'], LabController.list);
router.get(['/orders/:id', '/:id'], LabController.getById);
router.post(['/orders', '/'], LabController.create);
router.put(['/orders/:id', '/:id'], LabController.update);
router.patch(['/orders/:id', '/:id'], LabController.update);
router.post(['/orders/:id/results', '/:id/results'], LabController.updateResults);
router.put(['/orders/:id/results', '/:id/results'], LabController.updateResults);
router.post(['/orders/:id/report', '/:id/report'], LabController.uploadReport);
router.put(['/orders/:id/report', '/:id/report'], LabController.uploadReport);
router.delete(['/orders/:id', '/:id'], LabController.delete);

export default router;
