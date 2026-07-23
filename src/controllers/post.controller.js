import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary } from 'cloudinary';
import { uploadOnCloudinary } from "../utils/cloudinaryService.js";
import PostModel from "../models/post.model.js"

export const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user?._id;
    const localFilePath = req.file?.path;

    if (!content && !localFilePath) {
        throw new ApiError(400, "Content or Image is required to create a post");
    }

    let cloudinaryResponse = null;

    try {
      
        if (localFilePath) {
            cloudinaryResponse = await uploadOnCloudinary(localFilePath);
            
           
            if (!cloudinaryResponse) {
                throw new ApiError(500, "Failed to upload image to cloudinary");
            }
        }

        const newPost = await PostModel.create({
            user: userId,
            content: content || "",
            imageUrl: cloudinaryResponse?.secure_url || "",
            cloudinaryPublicId: cloudinaryResponse?.public_id || ""
        });

        return res
            .status(201)
            .json(new ApiResponse(201, newPost, "Post created Successfully"));

    } catch (error) {
        if (cloudinaryResponse?.public_id) {
            await cloudinary.uploader.destroy(cloudinaryResponse.public_id);
        }
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to create Post"
        );
    }
});

export const getUserPost = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if(!userId) {
        throw new ApiError(401, "Unauthorized access")
    }
    const posts = await PostModel.find({user: userId}).sort({createdAt: -1})

    return res 
    .status(200)
    .json(new ApiResponse(200, posts, "User post fetch Sucessfully" ))
})

export const deletPost = asyncHandler(async (req, res) => {
    const {postId} = req.params;
    const userId = req.user?._id;

    if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid post ID")
}

    const post = await PostModel.findById(postId)

    if(!post) {
        throw new ApiError(404, "Post not found")
    }
    if(post.user.toString() !== userId.toString()){
        throw new ApiError(403, "YOu are not authorized to delet this post " )
    }
    if(post.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(post.cloudinaryPublicId)
        } catch (error) {
            return new ApiError(500, "fail to delet cloudnary Image ")
        }
    }
    await PostModel.findByIdAndDelete(postId);
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await PostModel.find()
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "No posts available")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "Posts fetched successfully"))
})

export const softDeletePost = asyncHandler(async (req, res) => {
const { postId, reason } = req.body  

if (!postId) {
    throw new ApiError(400, "Invalid post ID")
}

const post = await PostModel.findById(postId)  

if (!post) {
    throw new ApiError(404, "Post not found")
}

const updatedPost = await PostModel.findByIdAndUpdate(
    postId,
    {
        isSoftDeleted: !post.isSoftDeleted,  
        deletedByReason: !post.isSoftDeleted ? reason : "" 
    },
    { new: true }
)

return res.status(200).json(
    new ApiResponse(200, updatedPost, 
        updatedPost.isSoftDeleted ? "Post soft deleted" : "Post restored"
    )
)
})


export const appealPost = asyncHandler(async (req, res) => {
    const { postId, userClarification } = req.body

    if (!postId) {
        throw new ApiError(400, "Post ID required")
    }

    if (!userClarification || userClarification === "") {
        throw new ApiError(400, "Appeal can't be empty")
    }

    const post = await PostModel.findById(postId)  

    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    if (!post.isSoftDeleted) {  
        throw new ApiError(400, "You can't apeal because post is not soft deleted by admin")
    }

    const updatedPost = await PostModel.findByIdAndUpdate( 
        postId,
        { userClarification: userClarification },  
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Appeal submit admin respond soon")
    )
})