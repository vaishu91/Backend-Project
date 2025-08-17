// require('dotenv').config({path: './env'});
import dotenv from "dotenv"
import connectDB from "./db/index.db.js";

dotenv.config({path: './env'})

connectDB()




/*---------------Not too good Approach----------------------
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening at port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()
*/