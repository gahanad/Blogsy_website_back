const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/Users');

const getNotifications = async(req, res)=>{
    try{
        const notifications = await Notification.find({recipient: req.user._id})
                                                .populate('sender', 'username profilePicture')
                                                .sort({createdAt: -1});
        res.status(200).json(notifications);
    }catch(error){
        console.error('Error while sending the notification, ',error);
        res.status(500).json({message: 'Server error while sending the notification'});
    }
}

const markNotificationAsRead = async(req, res)=>{
    const notificationId = req.params.id;
    try{
        const notification = await Notification.find({_id: notificationId, recipient: req.user._id});
        if(!notification){
            return res.status(404).json({message: 'Notification not found or not authorized'});
        }
        notification.read = true;
        await notification.save();
        res.status(200).json({message: 'Notification sent successfully, ',notification});
    }catch(error){
        console.error('Error marking the notification as read, ', error);
        res.status(500).json({message: 'Server error while marking the notification as read'});
    }
}

const markAllNotificationsAsRead = async(req, res)=>{
    try{
        await Notification.updateMany(
            {recipient: req.user._id, read: false,},
            {$set: {read: true}},
        );
        res.status(200).json({message: 'All notifications are marked as read'});
    }catch(error){
        console.error('Error marking all the notification as read, ', error);
        res.status(500).json({message: 'Server error while marking all the notification as read'});
    }
}

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
}