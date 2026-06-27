import express from "express"
import connectDB from "./db/index.js"

const app = express()

app.use(express.json())

connectDB()

app.get('/', (req, res) => {
    res.send('Api is running')
})

export default app
