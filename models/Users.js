const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
    {
        username:{
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        email:{
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            match: [/.+@.+\..+/, 'Please fill a valid email address'],
        }, 
        password:{
            type: String,
            required: true,
        },
        bio: {
            type: String,
            maxlength: 500 
        },
        profilePicture: {
            type: String 
        },
        socialLinks: {
            type: Map,
            of: String
        },
        followers:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        following:[ 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isActive: {
            type: Boolean,
            ref: 'User',
            default: true,
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        postsCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true
    }
);

userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; 

    return resetToken; 
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);