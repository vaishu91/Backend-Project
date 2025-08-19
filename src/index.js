// require('dotenv').config({path: './env'});
import dotenv from "dotenv"
import connectDB from "./db/index.db.js";

dotenv.config({path: './env'})

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERROR: ", error);
        throw error
    });
    
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB Connection Failed !!!", err);
})



/*---------------Not too good Approach----------------------

import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
const app = express();

(async () => {
    try {
        const connectedInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Connected Successful!! DB Host: ${connectedInstance.connection.host}`)
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