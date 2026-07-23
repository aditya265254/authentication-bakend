import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        trim: true,
        default: "",
    }, 
    imageUrl: {
        type: String,
        default: ""
    },
    cloudinaryPublicId: {
        type: String,
        default: ''
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
    }],
    sharesCount: {
            type: Number,
            default: 0,
        },
        isSoftDeleted: {
            type: Boolean,
            default: false,
        },
        deletedByReason: {
            type: String,
            default: ''
        },
        userClarification: {
            type: String,
            default: ''
        }

    
}, {timestamps: true})


const Post = mongoose.model('Post', postSchema)
export default Post ;