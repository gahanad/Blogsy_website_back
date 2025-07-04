const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './uploads/images',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

function fileType(file, cb){
    const filetypes = /jpeg|png|jpg|gif/;
    const extType = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = filetypes.test(file.mimetype);
    if(mimeType && extType){
        return cb(null, true);
    }else{
        cb('Error: images only');
    }
}

const upload = multer({
    storage: storage,
    limits: {fileSize: 2000000},
    fileFilter: function(req, file, cb){
        fileType(file, cb);
    }
}).single('image');

module.exports = upload;

// friend1
// token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODVhNDQzOWIyMTQyNDQ4ODAyZWZkZmIiLCJpYXQiOjE3NTA3NDYxNzAsImV4cCI6MTc1MDc0OTc3MH0.SUAjuE8hpPyA_eT8KLD9tqZ7aiyR7P12aIpT6zWuCdk
// id: 685a4439b2142448802efdfb

// friend2
// token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODVhNDRhOWIyMTQyNDQ4ODAyZWZkZmYiLCJpYXQiOjE3NTA3NDYyODEsImV4cCI6MTc1MDc0OTg4MX0.ThC-kRm9MuQydfF5eZxE2wo1-vT9D9j7ubxlqeQpEj4
// id: 685a44a9b2142448802efdff