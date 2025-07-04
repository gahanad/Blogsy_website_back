const mongoose = require('mongoose');

const commentSchema = mongoose.Schema(
    {
        post:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        author:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content:{
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        }
    },
    {
        timestamps: true,
    }
);

// commentSchema.path('comments').default([]);
const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;