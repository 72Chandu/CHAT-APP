import express from 'express'
import { protectRoute } from '../middleware/auth.js';
import { deleteMessage, deleteMessageForMe, forwardMessage, getMessage, getUsersForSidebar, markMessageAsSeen, sendMessage } from '../controllers/messageController.js';
const messageRouter=express.Router();

messageRouter.get('/users',protectRoute,getUsersForSidebar)
messageRouter.get('/:id',protectRoute,getMessage)
messageRouter.put('/mark/:id',protectRoute,markMessageAsSeen)
messageRouter.post('/send/:id',protectRoute,sendMessage)
messageRouter.delete("/delete/:id", protectRoute, deleteMessage);
messageRouter.delete("/delete-for-me/:id",protectRoute,deleteMessageForMe)
messageRouter.post("/forward/:id",protectRoute,forwardMessage);
export default messageRouter