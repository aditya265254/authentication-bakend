import { Router } from "express";
import {
  adminHardDelete,
  appealPost,
  commentPOst,
  createPost,
  deletPost,
  getAdminUserPosts,
  getAllPosts,
  getUserPost,
  likePost,
  restorePost,
  sharePost,
  softDeletePost,
  updatePost,
} from "../controllers/post.controller.js";
import { isAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create").post(verifyToken, upload.single("image"), createPost);
router.route("/my-posts").get(verifyToken, getUserPost);
router.route("/delet/:postId").delete(verifyToken, deletPost);
router.route("/feed").get(getAllPosts);
router
  .route("/soft-delete/:postId")
  .patch(verifyToken, isAdmin, softDeletePost);
router.route("/appeal-post/:postId").patch(verifyToken, appealPost);
router.route("/restore/:postId").patch(verifyToken, isAdmin, restorePost);
router
  .route("/update/:postId")
  .patch(verifyToken, upload.single("image"), updatePost);
router
  .route("/admin/delete/:postId")
  .delete(verifyToken, isAdmin, adminHardDelete);
router.route("/like/:postId").patch(verifyToken, likePost);
router.route("/comment/:postId").patch(verifyToken, commentPOst);
router.route("/share/:postId").patch(verifyToken, sharePost);
router
  .route("/admin/user-post/:userId")
  .get(verifyToken, isAdmin, getAdminUserPosts);

export default router;
