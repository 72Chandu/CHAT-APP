import React, { useState } from 'react'
import assets from '../assets/assets'

const LoginPage = () => {
  const [currState, setCurrState] = useState('Sign up')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)

  const onSubmitHandler = (e) => {
    e.preventDefault()
    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return
    }
    // Handle login/signup here
    console.log({currState,fullName,email,password,bio,})
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>

      {/* Left Side */}
      <img src={assets.logo_big} alt='Logo' className='w-[min(30vw,250px)]'/>

      {/* Right Side */}
      <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg w-[min(90vw,400px)]'>

        {/* Heading */}
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState}
          {isDataSubmitted && <img src={assets.arrow_icon} alt='Arrow' className='w-5 cursor-pointer' onClick={() => { setCurrState(currState === 'Sign up' ? 'Login' : 'Sign up'); setIsDataSubmitted(false)}}/>}
          
        </h2>

        {/* Full Name */}
        {currState === 'Sign up' && !isDataSubmitted && (
          <input type='text' value={fullName} onChange={(e) => setFullName(e.target.value)} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='Full Name' required/>
        )}

        {/* Email & Password */}
        {!isDataSubmitted && (
          <>
            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'/>
            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Password' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </>
        )}

        {/* Bio */}
        {currState === 'Sign up' && isDataSubmitted && (
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} rows={4} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='Provide a short bio...' required/>
        )}

        {/* Submit Button */}
        <button type='submit' className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
          {currState === 'Sign up'? isDataSubmitted? 'Create Account': 'Next': 'Login Now'}
        </button>

        {/* Terms */}
        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <input type='checkbox' id='terms' required/>
          <label htmlFor='terms'>Agree to the terms of use & privacy policy</label>
        </div>

        <div className='flex flex-col gap-2'>
          {currState==="Sign up"?(
            <p className='text-sm text-gray-600'>Already have an account? <span onClick={()=>{setCurrState("Login");setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
          ):(
            <p className='text-sm text-gray-600'>Create an account? <span onClick={()=>{setCurrState("Sign up")}} className='font-medium text-violet-500 cursor-pointer'>Click here</span></p>
          )}
        </div>

      </form>
    </div>
  )
}

export default LoginPage