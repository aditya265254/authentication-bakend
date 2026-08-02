import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { v2 as cloudinary } from 'cloudinary';
import { uploadOnCloudinary } from "../utils/cloudinaryService.js";
import PostModel from "../models/post.model.js"
import mongoose from "mongoose";
import redisClient from '../config/redis.js';

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

        await redisClient.del("feed:posts");
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

    if (!userId) {
        throw new ApiError(401, "Unauthorized access")
    }
    const posts = await PostModel.find({ user: userId }).sort({ createdAt: -1 })

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "User post fetch Sucessfully"))
})

export const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?._id;

    if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ApiError(400, "Invalid post ID")
    }

    const post = await PostModel.findById(postId)

    if (!post) {
        throw new ApiError(404, "Post not found")
    }
    if (post.user.toString() !== userId.toString()) {
        throw new ApiError(403, "YOu are not authorized to delet this post ")
    }
    if (post.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(post.cloudinaryPublicId)
        } catch (error) {
            return new ApiError(500, "fail to delet cloudnary Image ")
        }
    }
    await PostModel.findByIdAndDelete(postId);

    await Promise.all([
        redisClient.del("feed:posts"),
        redisClient.del(`post:${postId}:comments`),
        redisClient.del(`post:${postId}:liked_users`),
        redisClient.sRem('modified:posts', postId)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export const getAllPosts = asyncHandler(async (req, res) => {
    const cacheKey = "feed:posts";
    const userId = req.user?._id?.toString();

    try {
        let posts = [];

        // 1. Check karo ki Redis cache mein feed padi hai kya
        const cachedFeed = await redisClient.get(cacheKey);

        if (cachedFeed) {
            posts = JSON.parse(cachedFeed);
        } else {
            // 2. Agar cache mein nahi hai, toh MongoDB se lao
            const dbPosts = await PostModel.find({ isSoftDeleted: { $ne: true } })
                .lean()
                .populate("user", "fullName email")
                .populate("comments.user", "fullName email")
                .sort({ createdAt: -1 });

            if (!dbPosts || dbPosts.length === 0) {
                throw new ApiError(404, "No posts available");
            }
            posts = dbPosts;
        }

        // 3. Likes, Comments aur Shares sabhi ko parallel mein process karo
        await Promise.all(
            posts.map(async (post) => {
                const postId = post._id.toString();

                // --- LIKES HANDLING ---
                const likedUsersKey = `post:${postId}:liked_users`;
                const keyExists = await redisClient.exists(likedUsersKey);

                if (keyExists) {
                    const userIds = await redisClient.sMembers(likedUsersKey);
                    post.likes = userIds;
                    post.likesCount = userIds.length;
                    post.isLiked = userId ? userIds.includes(userId) : false;
                } else {
                    const mongoLikes = Array.isArray(post.likes)
                        ? post.likes.map((id) => id.toString())
                        : [];
                    post.likes = mongoLikes;
                    post.likesCount = mongoLikes.length;
                    post.isLiked = userId ? mongoLikes.includes(userId) : false;
                }

                // --- COMMENTS HANDLING (100% Safe Fallback) ---
                const commentKey = `post:${postId}:comments`;
                const commentsExist = await redisClient.exists(commentKey);

                if (commentsExist) {
                    const rawComments = await redisClient.lRange(commentKey, 0, -1);
                    post.comments = rawComments.map(c => {
                        const parsed = JSON.parse(c);
                        if (!parsed.user || typeof parsed.user !== 'object') {
                            parsed.user = { fullName: "User", email: "" };
                        }
                        return parsed;
                    });
                } else {
                    post.comments = (post.comments || []).map(comment => {
                        if (!comment.user || typeof comment.user !== 'object') {
                            comment.user = { fullName: "User", email: "" };
                        }
                        return comment;
                    });
                }

                // --- SHARES HANDLING ---
                const sharesKey = `post:${postId}:shares`;
                const sharesExist = await redisClient.exists(sharesKey);

                if (sharesExist) {
                    const redisShares = await redisClient.get(sharesKey);
                    post.sharesCount = parseInt(redisShares, 10);
                } else {
                    post.sharesCount = post.sharesCount || 0;
                }
            })
        );

        if (!cachedFeed) {
            await redisClient.setEx(cacheKey, 60, JSON.stringify(posts));
        }

        return res.status(200).json(
            new ApiResponse(200, posts, "Posts fetched successfully")
        );

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "Failed to fetch feed");
    }
});
export const softDeletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    const { reason } = req.body

    if (!postId) {
        throw new ApiError(400, "Invalid post ID")
    }

    const post = await PostModel.findById(postId)

    if (!post) {
        throw new ApiError(404, "Post not found")
    }

    if (post.isSoftDeleted) {
        throw new ApiError(400, "Post already soft deleted")
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        {
            isSoftDeleted: true,
            deletedByReason: reason
        },
        { new: true }
    )

    await redisClient.del("feed:posts");

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Post soft deleted successfully")
    )
})

export const appealPost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    const { userClarification } = req.body

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


export const restorePost = asyncHandler(async (req, res) => {
    const { postId } = req.params

    const post = await PostModel.findById(postId)
    if (!post) throw new ApiError(404, "Post not found")

    if (!post.isSoftDeleted) {
        throw new ApiError(400, "Post already active h")
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        {
            isSoftDeleted: false,
            deletedByReason: "",
            userClarification: ""
        },
        { new: true }
    )

    await redisClient.del("feed:posts");

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Post restored successfully")
    )
})

export const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    const { content, removeImage } = req.body
    const localFilePath = req.file?.path

    const post = await PostModel.findById(postId)
    if (!post) throw new ApiError(404, "Post not found")

    if (post.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post")
    }

    const updateFields = {}


    if (content) updateFields.content = content


    if (removeImage === "true" && post.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(post.cloudinaryPublicId)
        } catch (error) {
            throw new ApiError(500, "Image delete failed, try again")
        }
        updateFields.imageUrl = ""
        updateFields.cloudinaryPublicId = ""
    }


    if (localFilePath) {

        if (post.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(post.cloudinaryPublicId)
            } catch (error) {
                throw new ApiError(500, "Old image delete failed")
            }
        }

        const uploaded = await uploadOnCloudinary(localFilePath)
        if (!uploaded) throw new ApiError(500, "Image upload failed")

        updateFields.imageUrl = uploaded.secure_url
        updateFields.cloudinaryPublicId = uploaded.public_id
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        updateFields,
        { new: true }
    )

    await redisClient.del("feed:posts");

    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Post updated successfully")
    )
})

export const adminHardDelete = asyncHandler(async (req, res) => {
    const { postId } = req.params

    const post = await PostModel.findById(postId)
    if (!post) throw new ApiError(404, "Post not found")

    if (post.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(post.cloudinaryPublicId)
        } catch (error) {
            throw new ApiError(500, "Image delete failed")
        }
    }

    await PostModel.findByIdAndDelete(postId)

    await Promise.all([
        redisClient.del("feed:posts"),
        redisClient.del(`post:${postId}:comments`),
        redisClient.del(`post:${postId}:liked_users`),
        redisClient.sRem('modified:posts', postId)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {}, "Post permanently deleted")
    )
})



export const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id.toString();

    const post = await PostModel.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const likedUsersKey = `post:${postId}:liked_users`;


    const keyExists = await redisClient.exists(likedUsersKey);
    if (!keyExists) {
        const mongoLikes = Array.isArray(post.likes)
            ? post.likes.map((id) => id.toString())
            : [];
        if (mongoLikes.length > 0) {
            await redisClient.sAdd(likedUsersKey, mongoLikes);
        }
    }

    const hasLiked = await redisClient.sIsMember(likedUsersKey, userId);

    let isLiked = false;
    if (hasLiked) {
        await Promise.all([
            redisClient.sRem(likedUsersKey, userId),
            PostModel.findByIdAndUpdate(postId, { $pull: { likes: userId } })
        ]);
        isLiked = false;
    } else {
        await Promise.all([
            redisClient.sAdd(likedUsersKey, userId),
            PostModel.findByIdAndUpdate(postId, { $addToSet: { likes: userId } })
        ]);
        isLiked = true;
    }

    const liveLikes = await redisClient.sMembers(likedUsersKey);
    const currentLikesCount = liveLikes.length;

    await Promise.all([
        redisClient.sAdd('modified:posts', postId),
        redisClient.del("feed:posts")
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                content: post.content,
                imageUrl: post.imageUrl,
                likes: liveLikes,
                likesCount: currentLikesCount,
                isLiked: isLiked
            },
            isLiked ? "Post liked successfully" : "Post unliked successfully"
        )
    );
});

export const commentPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    const commentKey = `post:${postId}:comments`;

    // 1. Redis ke liye full object (Frontend ke liye)
    const redisCommentData = {
        user: {
            _id: userId,
            fullName: req.user.fullName,
            email: req.user.email
        },
        text: content,
        createdAt: new Date()
    };

    // 2. MongoDB ke liye sirf userId (Mongoose Schema ke mutabiq)
    const mongoCommentData = {
        user: userId,
        text: content,
        createdAt: new Date()
    };

    // Redis mein full data aur DB mein proper ObjectId push karo
    await redisClient.lPush(commentKey, JSON.stringify(redisCommentData));
    await PostModel.findByIdAndUpdate(postId, { $push: { comments: mongoCommentData } });

    // Cache clear karo
    await redisClient.del("feed:posts");

    return res.status(201).json(
        new ApiResponse(201, redisCommentData, "Comment added successfully")
    );
});

export const sharePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await PostModel.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    const sharesKey = `post:${postId}:shares`;

    const updatedSharesCount = await redisClient.incr(sharesKey);


    const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { sharesCount: 1 } },
        { returnDocument: 'after' }
    ).select("content imageUrl sharesCount likes comments");


    await redisClient.del("feed:posts");

    return res.status(200).json(
        new ApiResponse(200, { ...updatedPost.toObject(), sharesCount: updatedSharesCount }, "Post shared successfully")
    );
});

export const getAdminUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new ApiError(400, "Invalid user ID provided");
    }


    const posts = await PostModel.find({ user: userId })
        .populate("user", "fullName email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "User posts fetched for admin successfully"));
});

