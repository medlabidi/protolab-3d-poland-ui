import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateUserSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

router.get('/', requireAdmin, userController.getAllUsers);
router.delete('/:id', requireAdmin, userController.deleteUser);

export default router;