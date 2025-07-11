// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000, 
        },
        readBy: [ 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        
    },
    {
        timestamps: true, 
    }
);

module.exports = mongoose.model('Message', messageSchema);