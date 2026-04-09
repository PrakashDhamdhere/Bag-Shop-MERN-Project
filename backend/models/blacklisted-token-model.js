const mongoose = require('mongoose');

const blacklistedTokenSchema = mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('blacklisted-token', blacklistedTokenSchema);
