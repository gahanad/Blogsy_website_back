const {
    getUserProfileById, 
    updateUserProfile, 
    followUser, unfollowUser, 
    getUserFollowers, getUserFollowing,
    deactivateUser,
    uploadProfilePicture,
    getUserProfile,
    getUserByUsername,} = require('../controllers/userController');
const express = require('express');
const route = express.Router();
const {protect} = require('../middleware/authMiddleware');
const {uploadProfilePictureMid} = require('../middleware/profilePictureUploadMiddleware');

route.get('/username/:username', getUserByUsername);
route.get('/:id', getUserProfileById);
route.get('/profile/me', protect, getUserProfile);
route.put('/me', protect, updateUserProfile);
route.put('/:id/follow', protect, followUser);
route.put('/:id/unfollow', protect, unfollowUser);
route.get('/:id/followers', getUserFollowers);
route.get('/:id/following', getUserFollowing);
route.put('/me/deactivate', protect, deactivateUser);
route.put('/profile/picture', protect, uploadProfilePictureMid, uploadProfilePicture);


module.exports = route;

