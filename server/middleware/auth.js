//executed before the controller function 
import User from '../models/user.js'
import jwt from 'jsonwebtoken'

export const protectRoute=async(req,res,next)=>{
    try{
        const token=req.headers.token
        const decode=jwt.verify(token,process.env.JWT_SECRET)
        const user=await User.findById(decode.userId).select("-password")
        if(!user){
            return res.json({sucess:false,message:"user not found"})
        }

        req.user=user;
        next()
    }catch(e){
        console.log(e.message)
        res.json({sucess:false,message:e.message})
    }
}