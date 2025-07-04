const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        }],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        deletedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({participants: 1}, {unique: true});

module.exports = mongoose.model('Conversation', conversationSchema);