const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const { uploadProfilePicture } = require('../controllers/userController');


const uploadDir = './uploads/profile_pictures/';


if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: uploadDir, 
    filename: function(req, file, cb){
        
        if (!req.user || !req.user._id) {
            return cb(new Error('User not authenticated for file upload.'));
        }
        cb(null, req.user._id + '-' + Date.now() + path.extname(file.originalname));
    }
});


function checkProfileFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images Only for profile picture!');
    }
}


const uploadProfilePictureMid = multer({
    storage: storage,
    limits: { fileSize: 1500000 }, 
    fileFilter: function(req, file, cb){
        checkProfileFileType(file, cb);
    }
}).single('profilePicture'); 

module.exports = {
    uploadProfilePictureMid,
}