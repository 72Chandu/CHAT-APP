import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formateMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
const ChatContainer = () => {
  const { messages, sendMessage, getMessages, selectedUser, setSelectedUser, deleteMessage, deleteMessageForMe, forwardMessage, users } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)
  const [menuMessageId, setMenuMessageId] = useState(null)
  const [forwardMessageId, setForwardMessageId] = useState(null)
  const [replyMessage, setReplyMessage] = useState(null)
  const scrollEnd = useRef()
  const messageRefs = useRef({})
  const [highlightedMessage, setHighlightedMessage] = useState(null)

  const [input, setInput] = useState('')
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (input.trim() === "") return
    const messageData = { text: input.trim() }
    // Add reply information
    if (replyMessage) {
      messageData.replyTo = replyMessage._id
    }
    await sendMessage(messageData)
    setInput("")
    setReplyMessage(null)
  }
  const handleSendImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }
    const render = new FileReader()
    render.onload = async () => {
      await sendMessage({ image: render.result })
      e.target.value = ""
    }
    render.readAsDataURL(file)
  }
  // Delete text or image message
  const handleDeleteMessage = (messageId) => {
    const confirmDelete = window.confirm("Delete this message")
    if (confirmDelete) {
      deleteMessage(messageId)
    }
  }
  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId]
    if (!messageElement) return
    messageElement.scrollIntoView({behavior: "smooth", block: "center"})
    setHighlightedMessage(messageId)
    setTimeout(() => {
      setHighlightedMessage(null)
    }, 1500)
  }
  const handleDeleteForMe = async (messageId) => {
    const confirmDelete = window.confirm("Delete this message")
    if (!confirmDelete) return
    try {
      await deleteMessageForMe(messageId)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id)
    }
  }, [selectedUser])
  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])
  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>{selectedUser.fullName}{onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}</p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>
      {/* chat area */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg) => {
          const isMine = String(msg.senderId) === String(authUser?._id)

          return (
            <div key={msg._id} ref={(el)=>{messageRefs.current[msg._id]=el}} className={`flex items-end gap-2 w-full mb-3 transition-all duration-300 ${isMine ? "justify-end" : "justify-start"} ${highlightedMessage===msg._id ?"bg-violet-500/30 rounded-lg":""}`}>

              {/* Message + profile */}
              <div className={`flex items-end gap-2 ${isMine ? "flex-row" : "flex-row-reverse"}`}>

                {/* Message */}
                {msg.image ? (
                  <div className="relative">
                    <img src={msg.image} alt="" className="max-w-[230px] border border-gray-700 rounded-lg" />
                    <span className="absolute bottom-1 right-2 text-[10px] text-white bg-black/50 px-1 rounded">{formateMessageTime(msg.createdAt)}</span>
                  </div>
                ) : (
                  <div className="relative max-w-[250px]">
                    <div className={`p-2 pr-14 md:text-sm font-light break-all bg-violet-500/30 text-white rounded-lg ${isMine ? "rounded-br-none" : "rounded-bl-none"}`}>
                      {/* Replied message */}
                      {msg.replyTo && (
                        <div onClick={() => {const replyId =typeof msg.replyTo === "object"? msg.replyTo._id: msg.replyTo ;scrollToMessage(replyId)}} className="mb-1 px-2 py-1 border-l-2 border-violet-400 bg-black/20 rounded text-xs text-gray-300">
                          <p className="text-violet-400 font-medium"> Reply</p>
                          <p className="truncate">{typeof msg.replyTo === "object" ? msg.replyTo.text || "Image" : "Replied message"}</p>
                        </div>
                      )}

                      {/* Current message */}
                      <p>{msg.text} </p>
                      <img src={msg.image} alt="" className="max-w-[230px] border border-gray-700 rounded-lg" />
                      {/* Timestamp */}
                      <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">
                        {formateMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                {/* Profile */}
                <img src={isMine ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} className="w-7 rounded-full" />
              </div>

              {/* ⋮ Dropdown */}
              <div className="relative ml-auto">
                <button onClick={() => setMenuMessageId(menuMessageId === msg._id ? null : msg._id)} className="text-gray-400 hover:text-white text-lg px-2 cursor-pointer">⋮</button>
                {menuMessageId === msg._id && (
                  <div className="absolute top-full mt-1 right-0 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <button onClick={() => { setMenuMessageId(null); setReplyMessage(msg) }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer">↩ Reply</button>
                    <button onClick={() => { setMenuMessageId(null); setForwardMessageId(msg._id) }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer">➡ Forward</button>
                    {isMine ? (
                      <button onClick={() => { setMenuMessageId(null); handleDeleteMessage(msg._id) }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer"> 🗑 Delete</button>
                    ) : (
                      <button onClick={() => { setMenuMessageId(null); handleDeleteForMe(msg._id) }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer" >🗑 Delete for me</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {forwardMessageId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="w-80 max-h-[70vh] bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h2 className="text-white font-medium">Forward message</h2>
                <button onClick={() => setForwardMessageId(null)} className="text-gray-400 hover:text-white text-xl cursor-pointer">×</button>
              </div>

              {/* Users */}
              <div className="max-h-[50vh] overflow-y-auto">
                {users.filter((user) => String(user._id) !== String(authUser?._id)).map((user) => (
                  <button key={user._id}
                    onClick={async () => {
                      const success = await forwardMessage(forwardMessageId, user._id);
                      if (success) {
                        setForwardMessageId(null);
                      }
                    }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                  >
                    <img src={user.profilePic || assets.avatar_icon} className="w-10 h-10 rounded-full" alt="" />
                    <div className="text-left">
                      <p className="text-white">{user.fullName}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={scrollEnd}></div>
      </div>
      {/* bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">

        {/* Reply Preview */}
        {replyMessage && (
          <div className="flex items-center gap-3 bg-gray-800/90 border-l-4 border-violet-500 rounded-t-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-violet-400 text-xs font-medium">
                Replying to{" "}
                {String(replyMessage.senderId) === String(authUser?._id)? "yourself": selectedUser?.fullName}
              </p>
              {replyMessage.image ? (
                <div className="flex items-center gap-2">
                  <img src={replyMessage.image}className="w-8 h-8 rounded object-cover"alt=""/>
                  <p className="text-gray-300 text-xs truncate">Image</p>
                </div>
              ) : (
                <p className="text-gray-300 text-xs truncate"> {replyMessage.text}</p>
              )}
            </div>
            {/* Cancel Reply */}
            <button onClick={() => setReplyMessage(null)} className="text-gray-400 hover:text-white text-xl cursor-pointer" > ×</button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-100/12 rounded-full">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) =>
                e.key === "Enter" ? handleSendMessage(e) : null
              }
              type="text"
              placeholder={
                replyMessage? "Type your reply..." : "Send a message"
              }
              className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
            />
            <input onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg" hidden/>
            <label htmlFor="image"><img src={assets.gallery_icon} className="w-5 mr-2 cursor-pointer"/> </label>
          </div>
          <img onClick={handleSendMessage} src={assets.send_button}className="w-7 cursor-pointer"/>
        </div>
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="" className='max-w-16' />
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer