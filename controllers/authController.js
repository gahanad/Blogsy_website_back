const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const generateToken = (id)=>{
    return jwt.sign({ _id:id }, process.env.JWT_SECRET,{
        expiresIn: '1h',
    });
};

const registerUser = async(req, res)=>{
    const {username, email, password} = req.body;
    if(!username || !password || !email){
        return res.status(400).json({message: 'Please enter all the fields'});
    }

    try{
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({message: 'Email already exists'});
        }
        user = await User.findOne({username});
        if(user){
            return res.status(400).json({message: 'Username is already taken'});
        }

        // Hashing the password
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email, 
            password,
        });
        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email
            },
        });
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error during registration'});
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all the fields' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials - user not found' });
        }

        const match = await bcrypt.compare(password, user.password);

        console.log(`Entered password: "${password}"`);
        console.log(`Stored hash: "${user.password}"`);
        console.log(`bcrypt.compare result:`, match);

        if (!match) {
            return res.status(400).json({ message: 'Invalid credentials - password mismatch' });
        }
        if(!(user.isActive)){
            return res.status(400).json({message: 'Account is deactivated'});
        }
        const token = generateToken(user._id);

        return res.status(200).json({ 
            message: 'Login successful!',
            user,
            token
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};


const getMe = async(req, res)=>{
    if(req.user){
        res.status(200).json({
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            bio: req.user.bio,
            profilePicture: req.user.profilePicture,
        });
    }else{
        res.status(404).json({message: 'User data not found'});
    }
};


const forgotPassword = async (req, res) => {
    console.log('--- FORGOT PASSWORD REQUEST RECEIVED ---');
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide an email address' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`[Forgot Password] Attempt for non-existent email: ${email}`);
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }

        const resetToken = user.getResetPasswordToken(); 

        try {
            await user.save({ validateBeforeSave: false });
            console.log('User document saved successfully with token fields!');
        } catch (saveError) {
            console.error('ERROR during user.save() in forgotPassword:', saveError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false }); 
            return res.status(500).json({ message: 'Failed to save token to database. Please try again.' });
        }

        const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to:\n\n ${resetUrl}\n\nThis token is valid for 1 hour.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
            });

            res.status(200).json({ message: 'Email sent successfully with reset link.' });
        } catch (emailError) {
            console.error('Error sending reset email:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent.' });
        }

    } catch (error) {
        console.error('Error in forgot password (outer try-catch):', error);
        res.status(500).json({ message: 'Server error during password reset request.' });
    }
};

const resetPassword = async (req, res) => {
    console.log('--- RESET PASSWORD REQUEST RECEIVED (Initial Check) ---'); 
    console.log('Token received in URL (unhashed):', req.params.resetToken); 
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    console.log('Token after hashing (for DB query):', resetPasswordToken);
    console.log('Current Date.now():', Date.now());
    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }, 
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        user.password = req.body.password; 
        user.resetPasswordToken = undefined; 
        user.resetPasswordExpire = undefined;
        await user.save(); 

        res.status(200).json({ message: 'Password reset successfully.' });

    } catch (error) {
        console.error('Error during password reset:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
}