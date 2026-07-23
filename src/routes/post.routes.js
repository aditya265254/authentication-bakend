import { Router } from "express";
import { createPost, deletPost, getAllPosts, getUserPost } from "../controllers/post.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js'

const router = Router()

router.route("/create").post(verifyToken, upload.single("image"), createPost)
router.route("/my-posts").get(verifyToken, getUserPost);
router.route("/delet/:postId").delete(verifyToken, deletPost)
router.route("/feed").get(getAllPosts)

export default router;


