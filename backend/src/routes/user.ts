import { Router } from 'express';
import { UserController } from '../controllers/user';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'GESTOR']), userController.getAll);
router.get('/:id', authorize(['ADMIN', 'GESTOR']), userController.getById);
router.put('/:id', authorize(['ADMIN']), auditLog('USER'), userController.update);
router.delete('/:id', authorize(['ADMIN']), auditLog('USER'), userController.delete);
router.post('/:id/change-password', userController.changePassword);

export default router;

