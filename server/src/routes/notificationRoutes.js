import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// VAPID Public key endpoint
router.get('/vapid-public-key', (req, res) => notificationController.getVapidPublicKey(req, res));

// Push subscription endpoints
router.post('/subscribe', (req, res) => notificationController.subscribe(req, res));
router.post('/unsubscribe', (req, res) => notificationController.unsubscribe(req, res));
router.post('/check-subscription', (req, res) => notificationController.checkSubscription(req, res));

// Test push notification
router.post('/test', (req, res) => notificationController.sendTestNotification(req, res));

// In-app Notification history endpoints
router.get('/', (req, res) => notificationController.getNotifications(req, res));
router.patch('/read-all', (req, res) => notificationController.markAllAsRead(req, res));
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));
router.delete('/clear-all', (req, res) => notificationController.clearAll(req, res));

// Notification settings preferences
router.get('/settings/preferences', (req, res) => notificationController.getSettings(req, res));
router.put('/settings/preferences', (req, res) => notificationController.updateSettings(req, res));

export default router;
