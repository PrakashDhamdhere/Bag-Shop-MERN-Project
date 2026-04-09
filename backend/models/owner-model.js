const mongoose = require('mongoose')

const ownerSchema = mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    product: {
        type: Array,
        default: []
    },
    pictuer: String,
    gstin: String,
})

module.exports = mongoose.model('owner', ownerSchema);