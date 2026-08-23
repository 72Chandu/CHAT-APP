import React from 'react'
import assets, { imagesDummyData } from '../assets/assets'

const RightSidebar = ({ selectedUser }) => {
  if (!selectedUser) return null

  return (
    <div className='bg-[#8185B2]/10 text-white w-full h-full relative max-md:hidden'>
      {/* User Profile */}
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt={selectedUser.fullName} className='w-20 aspect-square rounded-full object-cover'/>

        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          <span className='w-2 h-2 rounded-full bg-green-500'></span>{selectedUser.fullName}
        </h1>

        <p className='px-10 mx-auto text-center'>{selectedUser.bio}</p>
      </div>

      <hr className='border-[#ffffff50] my-4' />

      {/* Media */}
      <div className='px-5 text-xs'>
        <p>Media</p>

        {/* Only Media section scrolls */}
        <div className='mt-2 max-h-[200px] overflow-y-auto grid grid-cols-2 gap-4 opacity-80'>
          {imagesDummyData.map((url, idx) => (
            <div key={idx} onClick={() =>window.open(url, '_blank', 'noopener,noreferrer') }className='cursor-pointer rounded overflow-hidden'>
              <img src={url} alt={`Media ${idx + 1}`} className='w-full aspect-square object-cover rounded-md'/>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button className='absolute bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600  text-white text-sm font-light py-2 px-20 rounded-full cursor-pointer hover:opacity-90 transition'>Logout</button>
    </div>
  )
}

export default RightSidebar