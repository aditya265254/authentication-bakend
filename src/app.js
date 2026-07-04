import express from "express"
import connectDB from "./db/index.js"
import authRouter from "./routes/auth.routes.js"
import session from "express-session"
import passport from "./config/passport.js"
import cors from "cors"

const app = express()
app.set('trust proxy', 1);



app.use(cors({                   
    origin: ["http://localhost:5173", "https://auth-aditya265254.netlify.app"],
    credentials: true
}))


app.use(express.json())

connectDB()

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res) => {
    res.send('Api is running')
})

app.use("/api/auth", authRouter)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Something went wrong"
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
})

export default app
