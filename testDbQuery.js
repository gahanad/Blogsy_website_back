// testDbQuery.js
require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const User = require('./models/Users'); // Adjust path if needed
const connectDB = require('./config/db'); // Assuming this connects your DB

const testUserLookup = async () => {
    await connectDB(); // Ensure DB is connected

    // Replace with the exact ID you are seeing in your console log (e.g., '6853cb456d8bbd945dfa2ce2')
    const targetUserId = '6853cb456d8bbd945dfa2ce2'; // PASTE THE ID FROM YOUR LOGS HERE

    console.log(`\n--- Testing direct findById for ID: ${targetUserId} ---`);

    try {
        const user = await User.findById(targetUserId).select('-password');

        if (user) {
            console.log('SUCCESS! User found directly:');
            console.log('User ID:', user._id.toString()); // Convert ObjectId to string for strict comparison
            console.log('Username:', user.username);
            console.log('Email:', user.email);
        } else {
            console.log('FAILURE: User NOT found with this ID directly in the database.');
        }
    } catch (error) {
        console.error('Error during direct findById test:', error.message);
    } finally {
        mongoose.connection.close(); // Close connection after test
    }
};

testUserLookup();