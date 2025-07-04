const express = require('express');
const route = express.Router();
const {
    getUserConversations,
    getConversationMessages,
    createConversationAndSendMessage,
    markMessagesAsRead,
    softDeleteConversation,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware'); 


route.use(protect);


route.get('/conversations', getUserConversations);


route.post('/conversations', createConversationAndSendMessage);

route.get('/conversations/:conversationId/messages', getConversationMessages);

route.put('/conversations/:conversationId/read', markMessagesAsRead);

route.put('/conversations/:conversationId/delete', softDeleteConversation);


module.exports = route;