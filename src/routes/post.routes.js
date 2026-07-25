import { Router } from "express";
import { adminHardDelete, appealPost, createPost, deletPost, getAllPosts, getUserPost, likePost, restorePost, softDeletePost, updatePost } from "../controllers/post.controller.js";
import { isAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from '../middlewares/multer.middleware.js'

const router = Router()

router.route("/create").post(verifyToken, upload.single("image"), createPost)
router.route("/my-posts").get(verifyToken, getUserPost);
router.route("/delet/:postId").delete(verifyToken, deletPost)
router.route("/feed").get(getAllPosts)
router.route("/softdeletpost/:postId").patch(verifyToken,isAdmin, softDeletePost)
router.route("/appealpost/:postId").patch(verifyToken, appealPost)
router.route("/restore/:postId").patch(verifyToken, isAdmin, restorePost)
router.route("/update/:postId").patch(verifyToken,upload.single("image"), updatePost)
router.route("/admin/delete/:postId").delete(verifyToken, isAdmin, adminHardDelete)
router.route("/like/:postId").patch(verifyToken, likePost)

export default router;


