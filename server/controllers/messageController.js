import User from "../models/user.js";
import Message from '../models/message.js'
import cloudinary from "../lib/cloudinary.js";
import {io,userSocketMap} from '../server.js'

//get all users except the logged in user
export const getUsersForSidebar=async(req,res)=>{
    try{
        const userId=req.user._id
        const filteredUser=await User.find({_id:{$ne:userId}}).select("-password")

        const unseenMessage={} //count the no of message not seen
        const promises=filteredUser.map(async (user)=>{
            const msg=await Message.find({senderId:user._id,receiverId:userId,seen:false})
            if(msg.length>0){
                unseenMessage[user._id]=msg.length
            }
        })
        await Promise.all(promises)
        res.json({success:true,users:filteredUser,unseenMessages: unseenMessage})
    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}

//get all message for selected user
export const getMessage=async(req,res)=>{
    try{
        const {id:selectedUserId}=req.params
        const myId=req.user._id
        const messages=await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ],
            deletedFor: {$ne: myId}
        })
        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true})
        res.json({success:true,messages})
    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}

//mark message as seen using message id
export const markMessageAsSeen=async(req,res)=>{
    try{
        const {id}=req.params
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}

//send message to selected user 
export const sendMessage=async(req,res)=>{
    try{
       const {text,image}=req.body
       const receiverId=req.params.id
       const senderId=req.user._id
       
       let imageUrl
       if(image){
        const uploadResponce=await cloudinary.uploader.upload(image)
        imageUrl=uploadResponce.secure_url
       }
       const newMessage=await Message.create({senderId,receiverId,text,image:imageUrl})
       
       //emit the new message to the recevier's socket
       const receiverSocketId=userSocketMap[receiverId]
       if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage",newMessage)
       }
       
       res.json({success:true, message:newMessage})
    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the message and make sure it belongs to the logged-in user
    const message = await Message.findOne({_id: id,senderId: userId,});

    if (!message) {
      return res.status(404).json({success: false,message: "Message not found or unauthorized",});
    }

    // If the message contains an image, delete it from Cloudinary
    if (message.image) {
      try {
        const imageUrl = message.image;
        const uploadPart = imageUrl.split("/upload/")[1];

        if (uploadPart) {
          const parts = uploadPart.split("/");

          // Remove the Cloudinary version segment, such as v123456
          const versionIndex = parts.findIndex(part =>/^v\d+$/.test(part));
          const publicIdParts =versionIndex !== -1 ? parts.slice(versionIndex + 1): parts;
          const publicId = publicIdParts.join("/").replace(/\.[^/.]+$/, "");

          if (publicId) {
            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result !== "ok" && result.result !== "not found") {
              console.error("Cloudinary deletion result:", result);
            }
          }
        }
      } catch (cloudinaryError) {
        // Continue deleting the chat message even if Cloudinary fails
        console.error("Cloudinary image deletion failed:",cloudinaryError.message);
      }
    }

    // Delete the message from MongoDB
    await Message.deleteOne({ _id: id });

    // Notify both users through Socket.IO
    const senderSocketId = userSocketMap[userId.toString()];
    const receiverSocketId =userSocketMap[message.receiverId.toString()];

    const deletePayload = {messageId: message._id.toString(),};

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", deletePayload);
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", deletePayload);
    }

    return res.json({success: true, message: "Message deleted successfully", });

  } catch (error) {
    console.error("Delete message error:", error.message);
    return res.status(500).json({success: false,message: error.message,});
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id
    const message = await Message.findById(id)
    if (!message) {
      return res.status(404).json({success: false,message: "Message not found"})
    }

    // Add current user to deletedFor
    await Message.findByIdAndUpdate(id, {$addToSet: {deletedFor: userId}})

    // Tell current user's frontend to remove it
    const socketId = userSocketMap[userId.toString()]
    if (socketId) {
      io.to(socketId).emit("messageDeletedForMe", { messageId: id})
    }
    res.json({success: true,message: "Message deleted from your chat"})
  } catch (error) {
    console.error("Delete for me error:", error.message)
    res.status(500).json({ success: false,message: error.message})
  }
}

export const forwardMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({success: false, message: "Receiver is required"});
    }
    const originalMessage = await Message.findById(id);

    if (!originalMessage) {
      return res.status(404).json({success: false, message: "Message not found"});
    }

    // Create a NEW message
    const forwardedMessage = await Message.create({
      senderId,
      receiverId,
      text: originalMessage.text || "",
      image: originalMessage.image || null
    });

    // Send it through Socket.IO
    const receiverSocketId = userSocketMap[receiverId.toString()];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage",forwardedMessage);
    }
    res.json({success: true,message: forwardedMessage });
  } catch (error) {
    console.error("Forward message error:", error.message);
    res.status(500).json({success: false,message: error.message});
  }
};