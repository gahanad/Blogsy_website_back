const express = require('express');
const route = express.Router();
console.log('Post routes loaded');
const {protect} = require('../middleware/authMiddleware');
const {createPost, getAllPost, getPostById, updatePost,deletePost, toggleLikes, getPostsOfSpecificUser, getHomeFeed, getPostsByHashtags} = require('../controllers/postController');
const commentRoutes = require('./commentRoutes');
const upload = require('../middleware/uploadMiddleware');


route.post('/', protect, upload, createPost);
route.get('/', getAllPost);
route.get('/:id', getPostById);
route.put('/:id', protect, upload, updatePost);
route.delete('/:id', protect, deletePost);
route.put('/:id/like', protect, toggleLikes);
route.get('/user/:userId', getPostsOfSpecificUser);
route.get('/feed', protect, getHomeFeed);
route.get('/hashtag/:tag', getPostsByHashtags);

// For comments
route.use('/:postId/comments', commentRoutes);

module.exports = route;