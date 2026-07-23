import { Router } from "express"
import authRouter from "./auth.routes.js"
import postRouter from "./post.routes.js"


export const IndexRouter = Router()

IndexRouter.use("/auth", authRouter)
IndexRouter.use("/posts", postRouter)
