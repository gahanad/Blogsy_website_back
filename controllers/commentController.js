const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

const addComment = async(req, res)=>{
    const {postId} = req.params;
    const {content} = req.body;

    const authorId = req.user._id;
    if(!content){
        return res.status(400).json({message: 'Please enter a comment'});
    }
    try{
        const postExists = await Post.findById(postId);
        if(!postExists){
            return res.status(404).json({message: 'Post not found'});
        }
        const newComment = new Comment({
            post: postId,
            author: authorId,
            content: content,
        })
        const savedComment = await newComment.save();
        const populatedComment = await Comment.findById(savedComment._id)
                                            .populate('author', 'username profilePicture');
        
        if(postExists.author.toString() !== req.user._id.toString()){
            const notification = new Notification({
                recipient: postExists.author,    
                sender: req.user._id,     
                type: 'comment',
                refId: postId,             
                message: `${req.user.username} has commented to your post`,
            })
            await notification.save();
            console.log("Notification of the comment sent");
        }
        res.status(200).json({
            message: 'Comment added successfully',
            comment: populatedComment,
            postExists,
        })
        
    }catch(error){
        console.error('Error adding comment:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format or User ID format' });
        }
        res.status(500).json({ message: 'Server error adding comment' });
    }
}

const getCommentsforPosts = async(req, res)=>{
    const {postId} = req.params;
    try{
        const postExists = await Post.findById(postId);
        if(!postExists){
            return res.status(404).json({message: 'Post not found'});
        }
        const comments = await Comment.find({post: postId})
                                      .populate('author', 'username profilePicture')
                                      .sort({createdAt: 1});

        res.status(200).json(comments);
    }catch(error){
        console.error('Error fetching comments for post:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Post ID format' });
        }
        res.status(500).json({ message: 'Server error fetching comments' });
    }
};

module.exports = {
    addComment,
    getCommentsforPosts,
}