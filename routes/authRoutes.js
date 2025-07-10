const express = require('express');
const router = express.Router();
const {registerUser, loginUser, getMe, forgotPassword, resetPassword} = require('../controllers/authController');
const {protect} = require('../middleware/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword/:resetToken', resetPassword);

module.exports = router;