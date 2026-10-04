import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formateMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
const ChatContainer = () => {
  const { messages, sendMessage, getMessages, selectedUser, setSelectedUser, deleteMessage,deleteMessageForMe } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)
  const [menuMessageId, setMenuMessageId] = useState(null)
  const scrollEnd = useRef()

  const [input, setInput] = useState('')
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (input.trim() === "") return null
    await sendMessage({ text: input.trim() })
    setInput("")
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
            <div key={msg._id} className={`flex items-end gap-2 w-full mb-3 ${isMine ? "justify-end" : "justify-start"}`}>

              {/* Message + profile */}
              <div className={`flex items-end gap-2 ${isMine ? "flex-row" : "flex-row-reverse"}`}>

                {/* Message */}
                {msg.image ? (
                  <div className="relative">
                    <img src={msg.image} alt="" className="max-w-[230px] border border-gray-700 rounded-lg" />
                    <span className="absolute bottom-1 right-2 text-[10px] text-white bg-black/50 px-1 rounded">{formateMessageTime(msg.createdAt)}</span>
                  </div>
                ) : (
                  <div className="relative max-w-[200px]">
                    <p className={`p-2 pr-14 md:text-sm font-light break-all bg-violet-500/30 text-white rounded-lg ${isMine ? "rounded-br-none" : "rounded-bl-none"}`}>{msg.text}
                      <span className="absolute bottom-1 right-2 text-[10px] text-gray-400">{formateMessageTime(msg.createdAt)}</span>
                    </p>
                  </div>
                )}
                {/* Profile */}
                <img src={isMine ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} className="w-7 rounded-full" />
              </div>

              {/* ⋮ Dropdown */}
              <div className="relative ml-auto">
                <button onClick={() => setMenuMessageId(menuMessageId === msg._id ? null : msg._id)} className="text-gray-400 hover:text-white text-lg px-2 cursor-pointer">⋮</button>
                {menuMessageId === msg._id && (
                  <div className="absolute top-full mt-1 right-0 bottom-7 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <button onClick={() => { setMenuMessageId(null) }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer">↩ Reply</button>
                    <button onClick={() => { setMenuMessageId(null) }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 cursor-pointer">➡ Forward</button>
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
        <div ref={scrollEnd}></div>
      </div>
      {/* bottom */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 rounded-full'>
          <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor="image"><img src={assets.gallery_icon} className='w-5 mr-2 cursor-pointer' /></label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} className='w-7 cursor-pointer' />
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