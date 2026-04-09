const mongoose = require('mongoose')

const DEFAULT_PROFILE_IMAGE = 'https://ik.imagekit.io/PrakashDhamdhere/default-profile-image.webp?updatedAt=1771829673388'

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        minLength: 3,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    }],
    contact: {
        type: Number,
        default: null,
    },
    address: {
        type: String,
        default: "",
        trim: true,
    },
    city: {
        type: String,
        default: "",
        trim: true,
    },
    state: {
        type: String,
        default: "",
        trim: true,
    },
    pincode: {
        type: String,
        default: "",
        trim: true,
    },
    country: {
        type: String,
        default: "",
        trim: true,
    },
    pictuer: {
        type: String,
        default: "",
    },
    profileImage: {
        type: String,
        default: DEFAULT_PROFILE_IMAGE,
        trim: true,
    },
}, {
    timestamps: true,
})

module.exports = mongoose.model('user', userSchema);