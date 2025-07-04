require('dotenv').config(); // <-- load .env
const mongoose = require('mongoose');
const User = require('./models/Users'); // adjust path if needed

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas');

        await User.deleteOne({ email: 'test@example.com' });

        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        });

        await user.save();
        console.log('✅ Test user created:', user);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

run();
