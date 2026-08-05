import express from "express"
import connectDB from "./db/index.js"
import session from "express-session"
import passport from "./config/passport.js"
import cors from "cors"
import { IndexRouter } from "./routes/index.routes.js"
import { startLikeSyncWorker } from "./services/syncService.js"

const app = express()
app.set('trust proxy', 1);



const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://postify-aditya265254.netlify.app",
    "https://postify-aditya265.netlify.app",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
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

startLikeSyncWorker();

app.use("/api/v1", IndexRouter)

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
