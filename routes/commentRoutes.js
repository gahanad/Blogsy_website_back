const express = require('express');
const route = express.Router({mergeParams: true});
const {addComment, getCommentsforPosts} = require('../controllers/commentController');
const {protect} = require('../middleware/authMiddleware');

route.post('/', protect, addComment);
route.get('/', getCommentsforPosts);

module.exports = route;