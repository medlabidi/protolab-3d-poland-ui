import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// User routes (authenticated)
router.get('/me', authenticate, (req, res) => userController.getMe(req, res));
router.put('/me', authenticate, (req, res) => userController.updateMe(req, res));
router.delete('/me', authenticate, (req, res) => userController.deleteMe(req, res));
router.get('/notifications', authenticate, (req, res) => userController.getNotifications(req, res));
router.patch('/notifications/:id/read', authenticate, (req, res) => userController.markNotificationRead(req, res));

// Admin routes
router.get('/admin/all', authenticate, (req, res) => userController.getAllUsers(req, res));
router.delete('/admin/:id', authenticate, (req, res) => userController.deleteUser(req, res));

export default router;