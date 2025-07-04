// controllers/messageController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Messages');
const User = require('../models/Users'); // Needed to validate recipient

// @desc    Get all conversations for the authenticated user
// @route   GET /api/messages/conversations
// @access  Private
const getUserConversations = async (req, res) => {
    const currentUserId = req.user._id;

    try {
        const conversations = await Conversation.find({ participants: currentUserId })
            .populate('participants', 'username profilePicture') // Populate participants' details
            .populate({ // Populate the last message and its sender
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username profilePicture'
                }
            })
            .sort({ updatedAt: -1 }); // Show most recently active conversations first

        // Filter out conversations that the user has "deleted" (soft delete)
        const activeConversations = conversations.filter(conv =>
            !conv.deletedBy.includes(currentUserId)
        );

        res.status(200).json({ conversations: activeConversations });

    } catch (error) {
        console.error('Error fetching user conversations:', error);
        res.status(500).json({ message: 'Server error fetching conversations.' });
    }
};

// @desc    Get messages within a specific conversation
// @route   GET /api/messages/conversations/:conversationId/messages
// @access  Private
const getConversationMessages = async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Fetch 20 messages per page
    const skip = (page - 1) * limit;

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        // Check if the current user is a participant in this conversation
        if (!conversation.participants.includes(currentUserId)) {
            return res.status(403).json({ message: 'Not authorized to view this conversation.' });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username profilePicture') // Populate sender details
            .sort({ createdAt: 1 }) // Oldest messages first (chronological order)
            .skip(skip)
            .limit(limit);

        const totalMessages = await Message.countDocuments({ conversation: conversationId });
        const totalPages = Math.ceil(totalMessages / limit);

        res.status(200).json({
            messages,
            currentPage: page,
            totalPages,
            totalMessages
        });

    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Conversation ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching messages.' });
    }
};


const markMessagesAsRead = async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(currentUserId)) {
            return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
        }

        // Find all unread messages for the current user in this conversation
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: currentUserId }, // Messages sent by the other party
                readBy: { $ne: currentUserId } // Where current user hasn't read it yet
            },
            {
                $push: { readBy: currentUserId }
            }
        );

        res.status(200).json({ message: 'Messages marked as read.' });

    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error marking messages as read.' });
    }
};

// @desc    Soft delete/archive a conversation for the current user
// @route   PUT /api/messages/conversations/:conversationId/delete
// @access  Private
const softDeleteConversation = async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation || !conversation.participants.includes(currentUserId)) {
            return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
        }

        // Add current user to deletedBy array if not already present
        if (!conversation.deletedBy.includes(currentUserId)) {
            conversation.deletedBy.push(currentUserId);
            await conversation.save();
        }

        res.status(200).json({ message: 'Conversation archived/deleted for this user.' });

    } catch (error) {
        console.error('Error soft deleting conversation:', error);
        res.status(500).json({ message: 'Server error deleting conversation.' });
    }
};

const saveNewMessage = async (senderId, recipientId, content) => {
    // Sort participant IDs to ensure consistent order for unique indexing
    const participants = [senderId, recipientId].sort();

    let conversation = await Conversation.findOne({ participants: { $all: participants } });

    if (!conversation) {
        // Create new conversation if it doesn't exist
        conversation = new Conversation({
            participants: participants,
        });
        await conversation.save();
        console.log(`[Messaging] New conversation created between ${senderId} and ${recipientId}`);
    } else {
        // If conversation existed but was deleted by sender, restore it
        if (conversation.deletedBy.includes(senderId)) {
            conversation.deletedBy = conversation.deletedBy.filter(id => !id.equals(senderId));
            await conversation.save();
            console.log(`[Messaging] Conversation restored by ${senderId}`);
        }
    }

    // Create the new message
    const newMessage = new Message({
        conversation: conversation._id,
        sender: senderId,
        content: content,
    });
    const savedMessage = await newMessage.save();

    // Update lastMessage in the conversation
    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    // Populate the sender on the saved message for immediate use (e.g., for Socket.IO)
    const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'username profilePicture');

    return { conversation, message: populatedMessage };
};

const createConversationAndSendMessage = async (req, res) => {
    const { recipientId, content } = req.body;
    const currentUserId = req.user._id;

    if (!recipientId || !content) {
        return res.status(400).json({ message: 'Recipient ID and message content are required.' });
    }
    if (recipientId.toString() === currentUserId.toString()) {
        return res.status(400).json({ message: 'You cannot send a message to yourself.' });
    }

    try {
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient user not found.' });
        }

        const { conversation, message: savedMessage } = await saveNewMessage(currentUserId, recipientId, content);

        // OPTIONAL: If you want to emit Socket.IO event even from REST API endpoint
        // You would need to pass `io` instance to this controller or create a separate emitter service.
        // For now, the primary real-time flow will be via the socket.on('send_message') directly.

        res.status(201).json({
            message: 'Message sent successfully.',
            conversationId: conversation._id,
            message: savedMessage,
        });

    } catch (error) {
        console.error('Error creating conversation/sending message (REST):', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        res.status(500).json({ message: 'Server error sending message.' });
    }
};


module.exports = {
    getUserConversations,
    getConversationMessages,
    createConversationAndSendMessage,
    markMessagesAsRead,
    softDeleteConversation, 
};