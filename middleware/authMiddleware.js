const jwt = require('jsonwebtoken');
const User = require('../models/Users');


const protect = async(req, res, next)=>{
    let token;
    console.log('1. Inside protect middleware.');
    console.log('2. Authorization Header:', req.headers.authorization); // Check if header is received
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(' ')[1];
            console.log('3. Extracted Token:', token); // Confirm token extraction
            
            console.log('4. JWT_SECRET:', process.env.JWT_SECRET);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            console.log('5. Decoded Token Payload:', decoded); 
            req.user = await User.findById(decoded._id).select('-password');
            

            if(!req.user){
                console.log('6. User not found from decoded token ID. ID:', decoded._id); // Log the ID that failed to find a user
                console.log('6. User not found, sending 401.');
                return res.status(401).json({message: 'Not authorized, user not found'});
            }
            console.log('7. User found:', req.user.username); // Confirm user was found
            next();
        }catch(error){
            console.error('Authorization error: ', error.message);
            if (error.name === 'TokenExpiredError'){
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            if (error.name === 'JsonWebTokenError'){
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
            res.status(500).json({ message: 'Server error during authentication' });
        }
    }
    else{
        return res.status(401).json({message: 'Not authorized, no token found'});
    }
}

module.exports = {protect};