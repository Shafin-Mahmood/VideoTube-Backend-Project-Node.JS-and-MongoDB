// Import custom error handler to throw structured API errors
import { ApiError } from "../utils/ApiError.js";

// Import async wrapper to handle errors in async functions automatically
import { asyncHandler } from "../utils/asyncHandler.js";

// Import JWT library to verify tokens
import jwt from "jsonwebtoken"

// Import User model to fetch user data from database
import { User } from "../models/user.model.js";

// Middleware to verify JWT token and authenticate user
export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // Extract token from cookies OR Authorization header (Bearer token)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // If no token found → user is not authenticated
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        // Verify token using secret key → decode payload (user info)
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // Find user in database using decoded token ID
        // Exclude sensitive fields like password and refreshToken
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        // If user does not exist → token is invalid or user deleted
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // Attach user data to request object for further use in routes
        req.user = user;

        // Pass control to next middleware or route handler
        next()

    } catch (error) {
        // If any error occurs (invalid token, expired, etc.), throw Unauthorized error
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})