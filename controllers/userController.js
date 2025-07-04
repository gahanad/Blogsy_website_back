const User = require('../models/Users');
const Notification = require('../models/Notification');

// get user profile using id
const getUserProfileById = async(req, res)=>{
    try{
        const id = req.params.id;
        const user = await User.findById(id).select('-password');
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json(user);
    }catch(error){
        console.error(`Error finding the user: ${error}`);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid User ID format' });
        }
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
}

// get user profile not by id
const getUserProfile = async(req, res)=>{
    try{
        const userProfile = await User.findById(req.user._id).select('-password');
        if(!userProfile){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({
            _id: userProfile._id,
            username: userProfile.username,
            email: userProfile.email,
            avatar: userProfile.avatar,
            bio: userProfile.bio,
            followers: userProfile.followers, 
            following: userProfile.following, 
            postsCount: userProfile.postsCount || 0 
        });
    }catch(error){
        console.error('Error fetching the user profile, ', error);
        res.status(500).json({message: 'Server error while fetching user profile'});
    }
}

const updateUserProfile = async(req, res)=>{
    const userId = req.user._id;
    const {username, email, bio, profilePicture, socialLinks} = req.body;
    try{
        const userExists = await User.findById(userId);
        if(!userExists){
            return res.status(404).json({message: 'User not found'});
        }
        if(username !== undefined){
            if(username !== userExists.username){
                const existUser = await User.findOne({username});
                if(existUser){
                    return res.status(400).json({message: 'User by that name already exits'});
                }
            }
            userExists.username = username;
        }
        if(email !== undefined){
            if(email !== userExists.email){
                const existUser = await User.findOne({email});
                if(existUser){
                    return res.status(400).json({message: 'User by that email already exits'});
                }
            }
            userExists.email = email;
        }
        if (bio !== undefined) userExists.bio = bio;
        if (profilePicture !== undefined) userExists.profilePicture = profilePicture;
        if (socialLinks !== undefined) userExists.socialLinks = socialLinks;
        const updatedUser = await userExists.save();
        return res.status(200).json({
            message: 'User profile updated successfully',
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
            socialLinks: updatedUser.socialLinks,
            profilePicture: updatedUser.profilePicture,
        })
    }catch(error){
        console.error('Error updating user profile:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: errors.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating profile' });
    }
}

const followUser = async(req, res)=>{
    console.log("Function is fetched");
    const usertofollowId = req.params.id;
    const currentId = req.user._id;

    console.log(`[DEBUG] Request to follow. Auth User ID: ${currentId}, User to Follow ID: ${usertofollowId}`);

    if(usertofollowId === currentId.toString()){
        console.log('[DEBUG] Attempted to follow self.');
        return res.status(400).json({message: 'You cannot follow yourself'});
    }
    try{
        const userToFollow = await User.findById(usertofollowId);
        if(!userToFollow){
            return res.status(400).json({message: 'User whom you are trying to follow doesnot exist'});
        }
        console.log(`[DEBUG] Found userToFollow: ${userToFollow.username} (${usertofollowId})`);
        const currentUser = await User.findById(currentId);

        if(currentUser.following.includes(usertofollowId)){
            return res.status(400).json({message: 'You are already following the user'});
        }
        userToFollow.followers.push(currentId);
        currentUser.following.push(usertofollowId);
        await currentUser.save();
        await userToFollow.save();

        const notification = new Notification({
            recipient: usertofollowId,
            sender: currentId,
            type: 'follow',
            refId: currentId,
            message: `${req.user.username} has followed your account`,
        })
        await notification.save();
        console.log(`[Notification] Follow notification created for ${userToFollow.username}.`);

        res.status(200).json({message: `Successfully followed the user ${usertofollowId}`});

    }catch(error){
        console.error('Error following user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Server error following user' });
    }
}

const unfollowUser = async(req, res)=>{
    const usertounfollowId = req.params.id;
    const currentId = req.user._id;
    if(usertounfollowId === currentId.toString()){
        return res.status(404).json({message: 'You cannot unfollow yourself'});
    }
    try{
        const userToUnfollow = await User.findById(usertounfollowId);
        if(!userToUnfollow){
            return res.status(404).json({message: 'The user whom you are trying to unfollow is not found'});
        }
        const currentUser = await User.findById(currentId);
        const isFollowing = currentUser.following.some(
            followId => followId.equals(usertounfollowId)
        )
        if(!isFollowing){
            return res.status(400).json({message: 'You are not following the user'});
        }
        currentUser.following = currentUser.following.filter(
            (id) => !id.equals(usertounfollowId)
        );
        await currentUser.save();

        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => !id.equals(currentId)
        );
        await userToUnfollow.save();
        res.status(200).json({message: 'Unfollowed successfully'});
    }catch(error){
        console.error('Error unfollowing the user: ', error);
        if(error.name === 'CastError'){
            res.status(400).json({message: 'Invalid Id format'});
        }
        res.status(500).json({message: 'Server error while unfollowing the user'});
    }
}

const getUserFollowers = async(req, res)=>{
    try{
        const user = await User.find(req.params.id)
                               .populate('followers', 'username profilePicture');
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json(user.followers);
    }catch(error){
        console.error('Error fetching followers:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Server error fetching followers' });
    }
}

const getUserFollowing = async(req, res)=>{
    try {
        const user = await User.findById(req.params.id)
                               .populate('following', 'username profilePicture'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.following);
    } catch (error) {
        console.error('Error fetching following list:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        res.status(500).json({ message: 'Server error fetching following list' });
    }
}

const deactivateUser = async(req, res)=>{
    const userId = req.user._id;
    try{
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        user.isActive = false;
        await user.save();
        res.status(200).json({message: 'Successfully deactivated the account'});
    }catch(error){
        console.error('Error deactivating the user: ', error);
        res.status(500).json({message: 'Server error while deactivating the user'});
    }
}

const uploadProfilePicture = async(req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const user = await User.findById(req.user._id); 
        if (!user) {
            
            if (req.file) {
                fs.unlink(req.file.path, (err) => { 
                    if (err) console.error('Error deleting uploaded file:', err);
                });
            }
            return res.status(404).json({ message: 'User not found.' });
        }

        
        if (user.profilePicture && user.profilePicture !== '/uploads/images/default_profile.png') {
            const oldImagePath = path.join(__dirname, '..', user.profilePicture);
            
            if (fs.existsSync(oldImagePath) && oldImagePath !== req.file.path) {
                fs.unlink(oldImagePath, (err) => { 
                    if (err) console.error('Error deleting old profile picture:', err);
                });
                console.log(`[File Cleanup] Attempting to delete old profile picture: ${oldImagePath}`);
            }
        }

        
        user.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
        await user.save();

        res.status(200).json({
            message: 'Profile picture updated successfully',
            profilePicture: user.profilePicture
        });

    } catch (error) {
        console.error('Error uploading profile picture:', error);
        
        if (req.file) {
            fs.unlink(req.file.path, (err) => { 
                if (err) console.error('Error deleting uploaded file on error:', err);
            });
        }
        res.status(500).json({ message: 'Server error uploading profile picture.' });
    }
};

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Backend: Attempting to find user by username: ${username}`);
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });
    if (!user) {
        console.log(`Backend: User '${username}' not found.`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log(`Backend: Found user: ${user.username}`); 
    res.json(user);
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
    getUserProfileById,
    getUserProfile,
    updateUserProfile,
    followUser,
    unfollowUser,
    getUserFollowers,
    getUserFollowing,
    deactivateUser,
    uploadProfilePicture,
    getUserByUsername,
}