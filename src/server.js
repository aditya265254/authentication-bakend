import app from "./app.js"
import { configDotenv } from "dotenv"
const connectSystem=async()=>{
    await dbConnect()
    app.listen(3000)
}

connectSystem()
