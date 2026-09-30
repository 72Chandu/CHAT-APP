import {createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext=createContext()

export const ChatProvider=({children})=>{
    const [messages,setMessages]=useState([])
    const [users,setUsers]=useState([])
    const [selectedUser,setSelectedUser]=useState(null)
    const [unseenMessages,setUnseenMessages]=useState({}) // {userId:no of message unseen}
    
    const {socket,axios}=useContext(AuthContext)
    
    //fn to get all user for sidebar
    const getUsers=async()=>{
        try{
            const {data}=await axios.get('/api/message/users');
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }

        } catch (error) {
            toast.error(error.messages)
            console.error('Error fetching users:', error);
        }
    }

    //fn to get all messages for selected user
    const getMessages=async(userId)=>{
        try{
            const {data}=await axios.get(`/api/message/${userId}`);
            if(data.success){
                setMessages(data.messages || [])
            }
        } catch (error) {
            toast.error(error.messages)
            console.error('Error fetching messages:', error);
        }
    }

    //fn to send message
    const sendMessage=async(messageData)=>{
        try{
            const {data}=await axios.post(`/api/message/send/${selectedUser._id}`,messageData);
            if(data.success){
                setMessages((prevMessage)=>[...prevMessage,data.message])
            }
        } catch (error) {
            toast.error(error.messages)
            console.error('Error sending message:', error);
        }
    }

    //fn to subscribe to message fo selected user
    const subscribeToMessage=async ()=>{
        if(!socket) return 
        socket.on("newMessage",(newMessage)=>{
            if(selectedUser && newMessage.senderId===selectedUser._id){
                newMessage.seen=true
                setMessages((prevMessages)=>[...prevMessages,newMessage])
                axios.put(`/api/message/mark/${newMessage._id}`)
            }else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,[newMessage.senderId]:prevUnseenMessages[newMessage.senderId]?prevUnseenMessages[newMessage.senderId]+1:1
                }))
            }
        })
    }

    //fn to unsuscribe from message
    const unsuscribeFromMessage=()=>{
        if(socket) socket.off("newMessage")
    }

    useEffect(()=>{
        subscribeToMessage()
        return ()=>unsuscribeFromMessage()
    },[socket,selectedUser])

    const value={messages,users,selectedUser,getUsers,getMessages,sendMessage,setSelectedUser,unseenMessages,setUnseenMessages}
    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}