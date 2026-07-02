import express from "express"
import connectDB from "./db/index.js"
import authRouter from "./routes/auth.routes.js"
import session from "express-session"
import passport from "./config/passport.js"
import cors from "cors"

const app = express()
app.set('trust proxy', 1);

app.use(cors({                   
    origin: ["http://localhost:5173"],
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

export default app
