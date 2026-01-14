import { Router } from 'express';
import { conversationsController } from '../controllers/conversations.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations for the user
router.get('/', conversationsController.getConversations);

// Get total unread message count
router.get('/unread', conversationsController.getUnreadCount);

// Get or create a conversation for an order
router.post('/order/:orderId', conversationsController.getOrCreateConversation);

// Get conversation by design request ID
router.get('/design-request/:designRequestId', conversationsController.getConversationByDesignRequest);

// Get or create a conversation for a design request
router.post('/design-request/:designRequestId', conversationsController.getOrCreateDesignRequestConversation);

// Get a specific conversation
router.get('/:conversationId', conversationsController.getConversation);

// Get messages for a conversation
router.get('/:conversationId/messages', conversationsController.getMessages);

// Send a message in a conversation
router.post('/:conversationId/messages', conversationsController.sendMessage);

// Mark messages as read
router.post('/:conversationId/read', conversationsController.markAsRead);

export default router;
