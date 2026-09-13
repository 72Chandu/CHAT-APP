import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/user.js"

export const signup=async(req,res)=>{
    const {fullName,email,password,bio}=req.body
    try{
        if(!fullName || !email || !password || !bio){
            return res.json({sucess:false,message:"missing details"})
        }
        const user=await User.findOne({email})
        if(user){
            return res.json({sucess:false,message:"account already exits"})
        }
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)
        const newUser=await User.create({fullName,email,password:hashedPassword,bio})
        const token=generateToken(newUser._id)
        res.json({sucess:true,userData:newUser,token,message:"account created successfully"})
    }catch(e){
        console.log(e.message)
        return res.json({sucess:false,message:error.message})
    }
}

export const login=async(req,res)=>{
    try{
        const {email,password}=req.body
        const userData=await User.findOne({email})
        const isPasswordCorrect=await bcrypt.compare(password,userData.password)
        if(!isPasswordCorrect){
            return res.json({sucess:false,message:"Invalid credentials"})
        }
        const token=generateToken(userData._id)
        res.json({sucess:true,userData,token,message:"login successfully"})
    }catch(e){
        console.log(e.message)
        return res.json({sucess:false,message:error.message})
    }
}

//controller to check if user is authenticated
export const checkAuth=(req,res)=>{
    res.json({sucess:true,user:req.user})
}

export const updateProfile=async(req,res)=>{
    try{
        const {profilePic,bio,fullName}=req.body
        const userId=req.user._id;
        let updateUser
        if(!profilePic){
            updateUser=await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        }else{
            const upload=await cloudinary.uploader.upload(profilePic)
            updateUser=await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }
        res.json({sucess:true,user:updateUser})
    }catch(e){
        console.log(e.message)
        res.json({sucess:false,message:e.message})
    }
}