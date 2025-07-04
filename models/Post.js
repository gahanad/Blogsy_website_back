const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
    {
        title:{
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        content:{
            type: String,
            required: true,
        },
        tag: [
            {
                type: String,
                // required: true,
                trim: true,
                lowercase: true,
            }
        ],
        author: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        image: {
            type: String,
        },
        views:{
            type: Number,
            default: 0,
        },
        likes:{
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }],
            default: [],
        },
        hashtags:[
            {
                type: String,
                trim: true,
                lowercase: true,
            }
        ],
        comments: {
            type: [{ // This indicates it's an array of Comment ObjectIds
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment', // This should reference your Comment model
            }],
            default: [], // Crucial: Ensures it's an empty array by default
        },
    },
    {
        timestamps: true,
    }
);

// postSchema.path('likes').default([]);


module.exports = mongoose.model('Post', postSchema);