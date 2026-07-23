import {mongoose} from "mongoose"

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.types.objectId,
        reg: "User",
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
    cloudnaryPublicId: {
        type: String,
        default: ''
    },
    like: [{
        type: mongoose.Schema.types.objectId,
        ref: "User"
    }],
    comments: [{
        user: {
            type: mongoose.Schema.types.objectId,
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
        sharesCount: {
            type: Number,
            default: 0,
        },
        isSoftDeleted: {
            type: Boolean,
            default: false,
        },
        deletedByReson: {
            type: String,
            default: ''
        },
        userClerification: {
            type: String,
            default: true
        }

    }]

    
}, {timestamps: true})


const Post = mongoose.model('Post', postSchema)
export default Post ;