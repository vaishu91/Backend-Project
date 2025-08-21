import mongoose, {Schema} from "mongoose";
import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // useful for searching, make searching more optimized
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avtar: {
        type: String, // Cloudinary url
        required: true
    },
    coverImage: {
        type: String // Cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is Required!"]
    },
    refreshToken: {
        type: String
    }
},{timestamps: true});

// pre hook from mongoose
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); //if password not modified

    this.password = bcrypt.hash(this.password, 10);
    next();
})

// Custom methods
userSchema.methods.isPasswordCorrect = async function(password){
    await bcrypt.compare(password, this.password) //[this.password] is encrypted & [password] is myPlaintextPassword
}

userSchema.methods.generateAccessToken = function(){ //we have access of database that's why we are creating function and using this keyword not arrow function
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};

export const User = mongoose.model("User", userSchema);