import User from "../models/user.model.js"
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'



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
