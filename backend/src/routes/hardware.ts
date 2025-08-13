import { Router } from 'express';
import { HardwareController } from '../controllers/hardware';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const hardwareController = new HardwareController();

router.use(authenticate);

router.get('/', hardwareController.getAll);
router.get('/:id', hardwareController.getById);
router.post('/', authorize(['ADMIN', 'GESTOR']), auditLog('HARDWARE'), hardwareController.create);
router.put('/:id', authorize(['ADMIN', 'GESTOR']), auditLog('HARDWARE'), hardwareController.update);
router.delete('/:id', authorize(['ADMIN']), auditLog('HARDWARE'), hardwareController.delete);

export default router;

