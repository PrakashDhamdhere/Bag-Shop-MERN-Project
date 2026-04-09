const jwt = require('jsonwebtoken');
const blacklistedTokenModel = require('../models/blacklisted-token-model');

function getTokenExpiryDate(token) {
    try {
        const decoded = jwt.decode(token);
        if (decoded?.exp) {
            return new Date(decoded.exp * 1000);
        }
    } catch {
        // If token decoding fails, fallback to a short retention.
    }

    const fallbackExpiry = new Date();
    fallbackExpiry.setDate(fallbackExpiry.getDate() + 3);
    return fallbackExpiry;
}

async function blacklistToken(token) {
    if (!token) return;

    const expiresAt = getTokenExpiryDate(token);

    await blacklistedTokenModel.updateOne(
        { token },
        { $setOnInsert: { token, expiresAt } },
        { upsert: true }
    );
}

async function isTokenBlacklisted(token) {
    if (!token) return false;
    const found = await blacklistedTokenModel.findOne({ token }).select('_id');
    return Boolean(found);
}

module.exports = {
    blacklistToken,
    isTokenBlacklisted,
};
