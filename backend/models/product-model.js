const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    image: {
        type: Buffer,
        default: null,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    category: {
        type: String,
        default: "general",
        trim: true,
        lowercase: true,
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    bgcolor: {
        type: String,
        default: "",
    },
    panelcolor: {
        type: String,
        default: "",
    },
    textcolor: {
        type: String,
        default: "",
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
})

module.exports = mongoose.model('product', productSchema);