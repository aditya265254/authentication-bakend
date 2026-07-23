import { Router } from "express";
import { createPost } from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js'

const router = Router()

router.route("/create").post(verifyToken, upload.single("image"), createPost)

export default router;