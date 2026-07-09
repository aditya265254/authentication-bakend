import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


export const verifyToken = asyncHandler(async (req, res, next ) => {

    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
        throw new ApiError(401, "token expired plz logged in ")
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()
})

export const isAdmin = asyncHandler(async (req, res, next) => {

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Access denied")
    }
    next()
})