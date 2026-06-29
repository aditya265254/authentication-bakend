import express from "express"
import connectDB from "./db/index.js"
import authRouter from "./routes/auth.routes.js"

const app = express()

app.use(express.json())

connectDB()

app.get('/', (req, res) => {
    res.send('Api is running')
})

app.use("/api/auth", authRouter)

export default app
