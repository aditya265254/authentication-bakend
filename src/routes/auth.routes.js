import { Router } from "express";
import { logIn, signUp } from "../controllers/auth.controller.js";


const router = Router();

router.route("/signup").post(signUp)
router.route("/login").post(logIn)

export default router;