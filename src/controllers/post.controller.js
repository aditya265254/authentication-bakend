import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary } from 'cloudinary';
import { uploadOnCloudinary } from "../utils/cloudinaryService.js";
import PostModel from "../models/post.model.js"

export const createPost = asyncHandler(async (req, res) => {
    const {content} = req.body
    const userId = req.user?._id
    const localFilePath = req.file?.path;
    if(!content && !localFilePath) {
        throw new ApiError(400, "Content or Image is required to create a post")
    }
    let cloudinaryResponse = null
    try {
        if(localFilePath) {
            cloudinaryResponse = await uploadOnCloudinary(localFilePath)
        } if (!cloudinaryResponse) {
            throw new ApiError(500, "Failed to upload image to cloudinary")
        }

        const newPost = await PostModel.create({
            user: userId,
            content: content || "",
            imageUrl: cloudinaryResponse?.secure_url || "",
            cloudinaryPublicId: cloudinaryResponse?.public_id || ""
        }) 
        return res
        .status(201)
        .json(new ApiResponse (201, newPost, "Post created Sucessfully"))


    } catch (error) {
        if(cloudinaryResponse?.public_id){
            await cloudinary.uploader.destroy(cloudinaryResponse.public_id)
        }
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Faile to create Post"
        )
    }
})