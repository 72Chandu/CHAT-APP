import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([])
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({}) // {userId:no of message unseen}
    const { socket, axios } = useContext(AuthContext)

    //fn to get all user for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get('/api/message/users');
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }

        } catch (error) {
            toast.error(error.messages)
            console.error('Error fetching users:', error);
        }
    }

    //fn to get all messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/message/${userId}`);
            if (data.success) {
                setMessages(data.messages || [])
            }
        } catch (error) {
            toast.error(error.messages)
            console.error('Error fetching messages:', error);
        }
    }

    //fn to send message
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/message/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessage) => [...prevMessage, data.message])
            }
        } catch (error) {
            toast.error(error.messages)
            console.error('Error sending message:', error);
        }
    }

    //fn to subscribe to message fo selected user
    const subscribeToMessage = async () => {
        if (!socket) return
        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true
                setMessages((prevMessages) => [...prevMessages, newMessage])
                axios.put(`/api/message/mark/${newMessage._id}`)
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    //fn to unsuscribe from message
    const unsuscribeFromMessage = () => {
        if (socket) socket.off("newMessage")
    }


    const deleteMessage = async (messageId) => {
        try {
            const { data } = await axios.delete(`/api/message/delete/${messageId}`);
            if (data.success) {
                setMessages(prev =>
                    prev.filter(msg => msg._id !== messageId)
                );
                toast.success("Message deleted successfully");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };
    const deleteMessageForMe = async (messageId) => {
            try {
                const { data } = await axios.delete(`/api/message/delete-for-me/${messageId}`)
                if (data.success) {
                    setMessages(prev =>
                        prev.filter(
                            msg => String(msg._id) !== String(messageId)
                        )
                    )
                }
            } catch (error) {
                toast.error(error.response?.data?.message || error.message )
            }
    }
    // useEffect(() => {
    //     subscribeToMessage()
    //     return () => unsuscribeFromMessage()
    // }, [socket, selectedUser])

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/message/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prev) => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }));
            }
        };

        const handleDeletedMessage = ({ messageId }) => {
            setMessages((prevMessages) =>
                prevMessages.filter(
                    (msg) => msg._id !== messageId
                )
            );
        };
        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleDeletedMessage);
        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", handleDeletedMessage);
        };
    }, [socket, selectedUser, axios]);
    const value = { messages, users, selectedUser, getUsers, getMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages, deleteMessage,deleteMessageForMe }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}