import { Router } from "express";
import { logIn, signUp, googleCallback, adminSignUp, getAllUsers } from "../controllers/auth.controller.js";
import passport from "../config/passport.js";
import { verifyToken } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/signup").post(signUp)
router.route("/login").post(logIn)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), googleCallback)

// admin section 

router.route("/admin/signup").post(adminSignUp)
router.route("/admin/dashbord").get(verifyToken, getAllUsers)
export default router;