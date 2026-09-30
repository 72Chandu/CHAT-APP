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
            ]
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