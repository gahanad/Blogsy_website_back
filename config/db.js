const mongoose = require('mongoose');

const connectDB = async()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected and running: ${conn.connection.host}`);
    }catch(error){
        console.log(`Trouble connecting the MongoDB: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;