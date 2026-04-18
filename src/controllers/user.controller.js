import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
 


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{
  

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
   

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

// Creates a controller function for changing the logged-in user's password.
// asyncHandler wraps async code so errors are automatically passed to error middleware.
const changeCurrentPassword = asyncHandler(async(req, res) => {

    // Extract old password and new password from the request body sent by client.
    const {oldPassword, newPassword} = req.body

    // Find the current logged-in user from database using user ID stored in req.user by verifyJWT middleware.
    const user = await User.findById(req.user?._id)

    // Check if the old password entered by user matches the hashed password in database.
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    // If old password does not match, throw an error.
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // Replace old password with new password.
    user.password = newPassword

    // Save updated password.
    // validateBeforeSave:false skips unnecessary validations.
    // Password hashing still works if defined in pre-save hook.
    await user.save({validateBeforeSave: false})

    // Return successful response.
    return res
    .status(200) // HTTP success status
    .json(new ApiResponse(200, {}, "Password changed successfully")) // Custom response object
})


// Creates controller for getting currently logged-in user's information.
const getCurrentUser = asyncHandler(async(req, res) => {

    // Send current user data stored in req.user (added by verifyJWT middleware).
    return res
    .status(200)
    .json(new ApiResponse(
        200,                    // success code
        req.user,                // user data
        "User fetched successfully" // success message
    ))
})


// Creates controller for updating account details.
const updateAccountDetails = asyncHandler(async(req, res) => {

    // Extract full name and email from request body.
    const {fullName, email} = req.body

    // Check if any required field is missing.
    if (!fullName || !email) {

        // Throw error if any field is empty.
        throw new ApiError(400, "All fields are required")
    }

    // Find logged-in user and update data.
    const user = await User.findByIdAndUpdate(

        req.user?._id, // find current user by id

        {
            $set: { // MongoDB $set updates these fields
                fullName, // update full name
                email: email // update email
            }
        },

        {new: true} // return updated document, not old one
        
    ).select("-password") // Exclude password from returned data

    // Send response after update.
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});


// Creates controller for updating user avatar/profile picture.
const updateUserAvatar = asyncHandler(async(req, res) => {

    // Get uploaded file path from multer.
    const avatarLocalPath = req.file?.path

    // If no file uploaded, throw error.
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // TODO comment:
    // Old avatar deletion from Cloudinary can be added later.

    // Upload local file to Cloudinary.
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    // If upload failed or no URL returned, throw error.
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    // Update user avatar URL in database.
    const user = await User.findByIdAndUpdate(

        req.user?._id, // current user id

        {
            $set:{
                avatar: avatar.url // save Cloudinary image URL
            }
        },

        {new: true} // return updated user
    ).select("-password") // hide password

    // Send success response.
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})


// Creates controller for updating cover image.
const updateUserCoverImage = asyncHandler(async(req, res) => {

    // Get uploaded cover image path from multer.
    const coverImageLocalPath = req.file?.path

    // If no file uploaded, throw error.
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    // TODO:
    // Delete old cover image later if needed.

    // Upload cover image to Cloudinary.
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // If upload fails, throw error.
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    // Update cover image URL in database.
    const user = await User.findByIdAndUpdate(

        req.user?._id, // current user

        {
            $set:{
                coverImage: coverImage.url // store new image URL
            }
        },

        {new: true} // return updated user
    ).select("-password") // hide password

    // Return success response.
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {

    
    const {username} = req.params


    
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }


   
    const channel = await User.aggregate([

        {
            
            $match: {
                username: username?.toLowerCase()
                
            }
        },


        {
            $lookup: {
                from: "subscriptions", 
       
                localField: "_id",
                foreignField: "channel",
    

                as: "subscribers"
        
            }
        },


        {
        
            $lookup: {
                from: "subscriptions",

                localField: "_id",

                foreignField: "subscriber",
                // যেসব channel user subscribe করেছে

                as: "subscribedTo"
            }
        },


        {
            
            $addFields: {

                // subscriber array কয়জন আছে count করবে
                subscribersCount: {
                    $size: "$subscribers"
                },

                // user কয়টা channel subscribe করেছে count
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },

                // current logged-in user subscribed কিনা check
                isSubscribed: {
                    $cond: {

                        // req.user._id subscribers list এ আছে কিনা check
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},

                        then: true,

                        else: false
                    }
                }
            }
        },


        {
            // শুধু প্রয়োজনীয় fields return করবে
            $project: {

                fullName: 1,

                username: 1,

                subscribersCount: 1,

                channelsSubscribedToCount: 1,

                isSubscribed: 1,

                avatar: 1,

                coverImage: 1,

                email: 1

            }
        }

    ])


    // যদি channel না পাওয়া যায়
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }


    // response পাঠাচ্ছে
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,

            channel[0], 
            // aggregate array return করে
            // first item নিচ্ছি

            "User channel fetched successfully"
        )
    )
})





const getWatchHistory = asyncHandler(async(req, res) => {


    // User aggregate query
    const user = await User.aggregate([

        {
            // logged in user find করছে
            $match: {

                _id: new mongoose.Types.ObjectId(req.user._id)

                // string id কে ObjectId এ convert
            }
        },


        {
            // watchHistory array এর video ids দিয়ে videos collection join
            $lookup: {

                from: "videos",

                localField: "watchHistory",
                // user model এর watchHistory

                foreignField: "_id",
                // videos _id এর সাথে match

                as: "watchHistory",


                // nested pipeline
                pipeline: [

                    {
                        // প্রতিটি ভিডিওর owner information আনবে
                        $lookup: {

                            from: "users",

                            localField: "owner",
                            // video owner id

                            foreignField: "_id",

                            as: "owner",


                            // owner থেকে শুধু limited data আনবে
                            pipeline: [

                                {
                                    $project: {

                                        fullName: 1,

                                        username: 1,

                                        avatar: 1
                                    }
                                }

                            ]
                        }
                    },


                    {
                        // owner array কে object বানাবে
                        $addFields:{

                            owner:{
                                $first: "$owner"

                                // প্রথম owner object নেয়
                                // কারণ owner একটাই
                            }

                        }
                    }

                ]
            }
        }

    ])


    // response return
    return res
    .status(200)
    .json(

        new ApiResponse(

            200,

            user[0].watchHistory,
            // user array এর প্রথম user এর watch history

            "Watch history fetched successfully"
        )

    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}