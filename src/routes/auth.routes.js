import { Router } from "express";
import { logIn, signUp, googleCallback } from "../controllers/auth.controller.js";
import passport from "../config/passport.js";



const router = Router();

router.route("/signup").post(signUp)
router.route("/login").post(logIn)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), googleCallback)


export default router;