import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendVerificationEmail from "../utils/sendEmail.js";
import Post from "../models/post.model.js";
import redisClient from "../config/redis.js";

export const signUp = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;


  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new ApiError(409, "Email already exists in database");
  }


  const token = crypto.randomBytes(32).toString("hex");


  const newUser = await User.create({
    fullName,
    email,
    password,
    verificationToken: token
  });

  try {

    await sendVerificationEmail(newUser.email, token);

    return res.status(201).json(
      new ApiResponse(201, null, "Registration successful! Please check your email to verify your account.")
    );
  } catch (mailError) {
    console.error("error in sending mail:", mailError);


    await User.findByIdAndDelete(newUser._id);


    throw new ApiError(500, "Failed to send verification email. Please try again later.");
  }
});

export const logIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userFind = await User.findOne({ email }).select("+password");
  if (!userFind) {
    throw new ApiError(401, "Email doesnot exist plz signUp");
  }
  const isPasswordValid = await userFind.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "invalid password");
  }

  if (!userFind.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email first before logging in.",
    );
  }
  const token = jwt.sign(
    { _id: userFind._id, email: userFind.email, role: userFind.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY },
  );


  const sessionData = {
    _id: userFind._id.toString(),
    fullName: userFind.fullName,
    email: userFind.email,
    role: userFind.role,
    isVerified: userFind.isVerified,
  };
  await redisClient.setEx(
    `user:session:${userFind._id.toString()}`,
    604800,
    JSON.stringify(sessionData)
  );

  userFind.password = undefined;
  return res
    .status(200)
    .json(new ApiResponse(200, { user: userFind, token }, "login sucessfully"));
});

export const googleCallback = asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { _id: req.user._id, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY },
  );


  const sessionData = {
    _id: req.user._id.toString(),
    fullName: req.user.fullName,
    email: req.user.email,
    role: req.user.role,
    isVerified: req.user.isVerified || true,
  };
  await redisClient.setEx(
    `user:session:${req.user._id.toString()}`,
    604800,
    JSON.stringify(sessionData)
  );

  return res.redirect(
    `${process.env.FRONTEND_URL}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`,
  );
});

export const logOut = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.token || req.headers.authorization?.split(" ")[1];
  const userId = req.user?._id?.toString();

  if (token) {

    await redisClient.setEx(`blacklist:${token}`, 604800, "true");
  }
  if (userId) {
    await redisClient.del(`user:session:${userId}`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const adminSignUp = asyncHandler(async (req, res) => {
  const { fullName, email, password, adminSecret } = req.body;
  if (!fullName || !email || !password || !adminSecret) {
    throw new ApiError(400, "All fildes is mandatory ");
  }
  if (adminSecret !== process.env.ADMIN_SECRET) {
    throw new ApiError(403, "forbidden");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "user alredy registerd in db ");
  }

  const newUser = await User.create({
    fullName,
    email,
    password,
    role: "admin",
  });
  if (!newUser) {
    throw new ApiError(402, "Error in saving data to database ");
  }
  const createdAdmin = await User.findById(newUser._id).select("-password");
  return res
    .status(201)
    .json(new ApiResponse(201, createdAdmin, "Admin registered Sucessfully"));
});


export const verifyEmail = asyncHandler(async (req, res) => {

  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }


  user.isVerified = true;
  user.verificationToken = undefined;


  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Email verified successfully! You can now log in."));
});


export const getAdminDashboardData = asyncHandler(async (req, res) => {

  const [users, totalPosts, pendingAppeals] = await Promise.all([
    User.find().select("-password").lean(),
    Post.countDocuments(),
    Post.find({
      isSoftDeleted: true,
      userClarification: { $exists: true, $ne: "" }
    }).populate("user", "fullName email").lean()
  ]);

  const totalUsers = users.length;

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      totalUsers,
      totalPosts,
      pendingAppeals
    }, "Admin dashboard data fetched successfully")
  );
});