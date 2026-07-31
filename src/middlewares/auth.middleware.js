import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import redisClient from "../config/redis.js"
import User from "../models/user.model.js"

export const verifyToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        throw new ApiError(401, "Token expired, please log in")
    }

    // 1. Check if token is blacklisted in Redis (e.g. user logged out)
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`)
    if (isBlacklisted) {
        throw new ApiError(401, "Token has been invalidated. Please log in again.")
    }

    // 2. Verify JWT token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid or expired token")
    }

    // 3. Fast Session Lookup from Redis memory (<1ms, 0 DB query)
    const sessionKey = `user:session:${decoded._id}`
    const cachedUserSession = await redisClient.get(sessionKey)

    if (cachedUserSession) {
        req.user = JSON.parse(cachedUserSession)
    } else {
        // Fallback to DB if session key expired, then re-seed Redis
        const userFromDb = await User.findById(decoded._id).select("-password").lean()
        if (!userFromDb) {
            throw new ApiError(401, "User no longer exists")
        }
        const sessionData = {
            _id: userFromDb._id.toString(),
            fullName: userFromDb.fullName,
            email: userFromDb.email,
            role: userFromDb.role,
            isVerified: userFromDb.isVerified
        }
        await redisClient.setEx(sessionKey, 604800, JSON.stringify(sessionData))
        req.user = sessionData
    }

    next()
})

export const isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Access denied")
    }
    next()
})