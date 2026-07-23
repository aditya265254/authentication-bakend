import { Router } from "express";
import { appealPost, createPost, deletPost, getAllPosts, getUserPost, softDeletePost } from "../controllers/post.controller.js";
import { isAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js'

const router = Router()

router.route("/create").post(verifyToken, upload.single("image"), createPost)
router.route("/my-posts").get(verifyToken, getUserPost);
router.route("/delet/:postId").delete(verifyToken, deletPost)
router.route("/feed").get(getAllPosts)
router.route("/softdeletpost").patch(verifyToken,isAdmin, softDeletePost)
router.route("/appealpost").patch(verifyToken, appealPost)

export default router;


