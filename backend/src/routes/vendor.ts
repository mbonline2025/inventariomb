import { Router } from 'express';
import { VendorController } from '../controllers/vendor';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const vendorController = new VendorController();

router.use(authenticate);

router.get('/', vendorController.getAll);
router.get('/:id', vendorController.getById);
router.post('/', authorize(['ADMIN', 'GESTOR']), auditLog('VENDOR'), vendorController.create);
router.put('/:id', authorize(['ADMIN', 'GESTOR']), auditLog('VENDOR'), vendorController.update);
router.delete('/:id', authorize(['ADMIN']), auditLog('VENDOR'), vendorController.delete);

export default router;

