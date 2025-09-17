import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken() //methods
        const refreshToken = user.generateRefreshToken() //methods

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for img, avtar
    // upload them to cloudinary, avtar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for userCreation
    // return res


    // get user details from frontend----->
    const {fullName, email, userName, password} = req.body
    // console.log(email);

    // validation - not empty------>
    // if ( fullName === "" ){
    //     throw new ApiError(400, "fullName is required");
    // }
    // OR
    if (
        [fullName, email, userName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }
    
    // check if user already exists: username, email------>
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if ( existedUser ) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // check for img, avtar------>
    // console.log(req.files);

    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    // const covarImageLocalPath = req.files?.coverImage[0]?.path;
    let covarImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        covarImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avtar file is required");
    }

    // upload them to cloudinary, avtar------>
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(covarImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avtar file is required");
    }
    
    // create user object - create entry in db------>
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    // remove password and refresh token field from response------>
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for userCreation------>
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the User");
    }

    // return res------>
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
} );

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> data
    // login with username / email
    // find user
    // verify password
    // access and refresh token
    // send cookies
    
    // req.body -> data--------->
    const {email, userName, password} = req.body;

    // login with username / email----------->
    if(!(userName || email)) {
        throw new ApiError(400, "username or email is required");
    }

    // find user-------->
    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist");
    }

    // verify password--------->
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(404, "Invalid user Credentials");
    }

    // access and refresh token--------->
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookies---------->
    const options = {   //object
        httpOnly: true,
        secure: true
    }// because of this these cookies can modify by server only

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,{user: loggedInUser, accessToken, refreshToken}/*data*/, 
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
            new: true
        }
    )
    const options = {   //object
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200), {}, "User loggedout successfully")
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or Used");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )   
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};