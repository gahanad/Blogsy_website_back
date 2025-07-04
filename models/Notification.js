const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['like', 'comment', 'follow', 'post'],
        },
        refId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        message: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        }
    },
    {
        timestamps: true,
    }
);



module.exports = mongoose.model('Notification', notificationSchema);