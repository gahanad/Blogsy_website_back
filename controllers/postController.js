const Post = require('../models/Post');
const User = require('../models/Users');
const { post } = require('../routes/authRoutes');
const {protect} = require('../middleware/authMiddleware');
const { response } = require('express');
const Notification = require('../models/Notification');
const {extractHashtags} = require('../utils/hashtagUtils');

const createPost = async(req, res)=>{
    const {title, content, tag} = req.body;
    const imagePath = req.file ? `/uploads/images/${req.file.filename}` : null; // Get path for DB
    if(!title || !content){
        return res.status(401).json({message: 'Please enter title and content to proceed'});
    }
    try{
        const hashtags = extractHashtags(content);
        const newPost = new Post({
            title, 
            content,
            tag: tag || [],
            image: imagePath,
            author: req.user._id,
            hashtags
        });
        const savePost = await newPost.save();

        await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { postsCount: 1 } }
        );
        
        const postwithAuthor = await savePost.populate('author', 'username email');

        res.status(201).json({
            message: 'Post created successfully',
            post: postwithAuthor,
        });
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error creating the post'});
    }
};

// console.log('getPosts controller hit');
const getAllPost = async(req, res)=>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page-1)*limit;
    const keyword = req.query.search
        ? {
              $or: [ 
                  { title: { $regex: req.query.search, $options: 'i' } }, 
                  { content: { $regex: req.query.search, $options: 'i' } }, 
                  { tags: { $in: [new RegExp(req.query.search, 'i')] } } 
              ],
          }
        : {};

    try{
        const totalPosts = await Post.countDocuments({ ...keyword });
        const posts = await Post.find({ ...keyword })
                                .populate('author', 'username profilePicture')
                                .sort({ createdAt: -1})
                                .skip(skip)
                                .limit(limit);
        res.status(200).json({
            posts,
            page,
            pages: Math.ceil(totalPosts / limit), 
            totalPosts,
        });
    }catch(error){
        console.error('Error fetching posts: ',error);
        res.status(500).json({message: 'Server error while fetching the posts'});
    }
};

const getPostById = async(req, res)=>{
    try{
        const id = req.params.id;
        const postId = await Post.findById(id)
                           .populate('author', 'username profilePicture');
        if(!postId){
            return res.status(401).json({message: 'Post not found'});
        }

        postId.views += 1;
        await postId.save();
        res.status(200).json({
            message: 'Post retrieved successfully',
            postId,
        })
    }catch(error){
        console.error(error);
        if(error.name === 'CastError'){
            return res.status(401).json({message: 'Invalid post format'});
        }
        res.status(500).json({message: 'Server error while retrieving the post'});
    }   
};


const updatePost = async (req, res) => {
    try {
        const { id } = req.params; 
        
        const { title, content, tags } = req.body;

        let imagePath = req.file ? `/uploads/images/${req.file.filename}` : null;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!post.author.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }

        if (title !== undefined) {
            post.title = title;
        }

        if (content !== undefined) {
            post.content = content;
            post.hashtags = extractHashtags(content);
        }

        if (tags !== undefined) {
             post.tags = tags;
        }

        if (imagePath) {
           
            post.image = imagePath;
        } else if (req.body.removeImage === 'true') {
            post.image = undefined; 
        }

        const updatedPost = await post.save(); 

        const updatedPopulatedPost = await Post.findById(updatedPost._id)
            .populate('author', 'username profilePicture');

        res.status(200).json({
            message: 'Post updated successfully',
            post: updatedPopulatedPost,
        });

    } catch (error) {
        console.error('Error updating post:', error); 

        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating post' });
    }
};


const deletePost = async(req, res)=>{
    try{
        const id = req.params.id;
        const post = await Post.findById(id);
        if(!post){
            res.status(404).json({message: 'Post not found'});
        }
        // To check if the post owned by the user
        if(!post.author.equals(req.user._id)){
            res.status(403).json({message: 'Not authorized author for deletion'});
        }
        // Deleting the post
        await Post.deleteOne({_id: id});
        res.status(200).json({message: 'Post deleted successfully'});
    }catch(error){
        console.error(`Deletion error: ${error}`);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format' });
        }
        res.status(500).json({ message: 'Server error deleting post' });
    }
}

const toggleLikes = async(req, res)=>{
    const {id} = req.params;
    const userId = req.user._id;
    try{
        const post = await Post.findById(id);
        if(!post){
            return res.status(404).json({message: 'Post not found'});
        }

        const hasLiked = post.likes.includes(userId);
        if(hasLiked){
            post.likes = post.likes.filter(
                (likeId)=>!likeId.equals(userId)
            )
            await post.save();
            res.status(200).json({message: 'Unliked successfully'});
        }else{
            post.likes.push(userId);
            message = "Post Liked";
            if(post.author.toString() !== userId.toString()){
                const notification = new Notification({
                    recipient: post.author,
                    sender: userId,
                    type: 'like',
                    refId: post.id,
                    message: `${req.user.username} has liked your post`,
                });
                await notification.save();
                console.log("Notification created");
            }
            await post.save();
            res.status(200).json({message: 'Liked successfully'});
        }
        
    }catch(error){
        console.error('Error toggling like:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format' });
        }
        res.status(500).json({ message: 'Server error toggling like' });
    }
}

const getPostsOfSpecificUser = async(req, res)=>{
    const {userId} = req.params;
    try{
        // const user = await User.findById(userId);
        const userExists = await User.findById(userId);
        if(!userExists){
            return res.status(404).json({message: 'User not found'});
        }
        const post = await Post.find({author: userId})
                               .populate('author', 'username profilePicture')
                               .sort({createAt: -1});
        res.status(200).json(post);
    }catch(error){
        console.error('Error getting a post :', error);
        if(error.name === 'CastError'){
            return res.status(400).json({message: 'Invalid Post ID format'});
        }
        res.status(500).json({message: 'Server error while getting the posts'});
    }
} 

const getHomeFeed = async (req, res) => {
    const currentUserId = req.user._id; 
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit;

    try {
        const currentUser = await User.findById(currentUserId).select('following');

        if (!currentUser) {
            return res.status(404).json({ message: 'Current user not found.' });
        }

        const followedUsersIds = currentUser.following;

        if (followedUsersIds.length === 0) {
            return res.status(200).json({
                posts: [],
                currentPage: page,
                totalPages: 0,
                totalPosts: 0,
                message: 'You are not following anyone yet. Follow users to see posts in your feed!'
            });
        }

        const posts = await Post.find({ author: { $in: followedUsersIds } })
            .populate('author', 'username profilePicture') 
            .sort({ createdAt: -1 }) // Sorting by newest posts first
            .skip(skip) 
            .limit(limit); 

        const totalPosts = await Post.countDocuments({ author: { $in: followedUsersIds } });
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts
        });

    } catch (error) {
        console.error('Error fetching home feed:', error);
        res.status(500).json({ message: 'Server error fetching home feed' });
    }
};

const getPostsByHashtags = async(req, res)=>{
    const hashtag = req.params.tag ? req.params.tag.toLowerCase() : ''; // Get tag from URL and convert to lowercase
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!hashtag) {
        return res.status(400).json({ message: 'Please provide a hashtag to search for.' });
    }

    try {
        // Find posts where the 'hashtags' array contains the specified tag
        const posts = await Post.find({ hashtags: hashtag })
            .populate('author', 'username profilePicture') // Populate author details
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        const totalPosts = await Post.countDocuments({ hashtags: hashtag });
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            hashtag: hashtag,
            posts,
            currentPage: page,
            totalPages,
            totalPosts
        });

    } catch (error) {
        console.error(`Error fetching posts for hashtag "${hashtag}":`, error);
        res.status(500).json({ message: 'Server error fetching hashtag posts.' });
    }
}

module.exports = {
    createPost,
    getAllPost,
    getPostById,
    updatePost,
    deletePost,
    toggleLikes,
    getPostsOfSpecificUser,
    getHomeFeed,
    getPostsByHashtags,
}