const express = require('express');
const mongoSanitize = require('express-mongo-sanitize'); 
const app = express();
const path = require('path');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const User = require('./models/Users');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const {notFound, errorHandling} = require('./middleware/errorMiddleware');
const PORT = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors({
  origin: '*', // <-- Ensure this exactly matches your frontend's URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true, // Allow sending cookies/authorization headers
  optionsSuccessStatus: 204, // Some older browsers require this
}));
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');



connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/messages', messageRoutes);



app.get('/',(req, res)=>{
    res.send("Hello World");
})
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log(process.env.MONGODB_URI)

app.listen(PORT, ()=>{
    console.log(`Server is running on PORT number ${PORT}`);
});

