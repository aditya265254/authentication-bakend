import { Router } from "express";
import {
  logIn,
  signUp,
  googleCallback,
  adminSignUp,
  verifyEmail,
  getAdminDashboardData,
} from "../controllers/auth.controller.js";
import passport from "../config/passport.js";
import { isAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { loginRateLimiter } from "../middlewares/ratelimit.middleware.js";

const router = Router();

router.route("/signup").post(signUp);
router.route("/login").post(loginRateLimiter(5, 300) ,logIn);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  loginRateLimiter(5,300),
  googleCallback,
);

// admin section

router.route("/admin/signup").post(adminSignUp);

router.route("/verify-email").get(verifyEmail);
router
  .route("/admin/dashbord-data")
  .get(verifyToken, isAdmin, getAdminDashboardData);
export default router;
