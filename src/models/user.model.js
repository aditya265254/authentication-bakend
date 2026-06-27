import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        require: [true, "email is require"],
        uniqued: true,
        lowercase: true,
        match: [regex, 'error message']
    },
    password: {
        type: String,
         require: [true, "Password is required"],
         minlength: [8, "length is grater then 8"],
         select: false
    }, 
    googleId: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null 
    },


}, {timestamps: true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        return next()
    }
    try {
        
        const salt = await bcryptjs.genSalt(10)
        this.password = await bcryptjs.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
})

userSchema.methods.isPasswordCorrect = async function(plainPassword) {
    return await bcryptjs.compare(plainPassword, this.password)
}

const User = mongoose.model("User", userSchema)

export default User