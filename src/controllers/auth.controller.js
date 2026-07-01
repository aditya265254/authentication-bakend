import User from "../models/user.model.js"
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"



export const signUp = asyncHandler(async (req, res) => {
    const {fullName, email, password} = req.body
    const existingEmail = await User.findOne({email})
    if (existingEmail) {
        throw new ApiError(409, "Email alredy exist in data base")
    }
    const newUser = await User.create({
        fullName, 
        email,
        password
    })
    return res.status(201).json(new ApiResponse(201, newUser, "User created sucessfully"))
})


export const logIn = asyncHandler(async (req, res) => {
    const {email, password } = req.body
    const userFind = await User.findOne({email}).select("+password")
    if (!userFind) {
        throw new ApiError(401, "Email doesnot exist plz signUp")
    } 
    const isPasswordValid = await userFind.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid password")
    }
    const token = jwt.sign({_id:userFind._id, email: userFind.email}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRY})
    userFind.password = undefined
    return res.status(200).json(new ApiResponse(200, {user: userFind, token}, "login sucessfully"))
})

export const googleCallback = asyncHandler(async (req, res) => {

    const token = jwt.sign(
        { _id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
    )
    
    return res.status(200).json(
        new ApiResponse(200, { user: req.user, token }, "Google login successful")
    )
})