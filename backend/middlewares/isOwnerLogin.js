const jwt = require('jsonwebtoken');
const ownerModel = require('../models/owner-model')
const { isTokenBlacklisted } = require('../utils/tokenBlacklist');

module.exports = async (req, res, next)=>{
    if(!req.cookies.token2){
        return res.status(401).json({ message: "you need to login first" })
    }

    try {
        const token = req.cookies.token2;
        const isBlacklisted = await isTokenBlacklisted(token);
        if(isBlacklisted){
            res.cookie("token2","")
            return res.status(401).json({ message: "session expired. please login again" })
        }

        let decoded = jwt.verify(token, process.env.JWT_KEY);
        let owner = await ownerModel
        .findOne({email: decoded.email})
        .select("-password");
        if(!owner){
            res.cookie("token2","")
            return res.status(401).json({ message: "you need to login first" })
        }
        req.owner = owner;
        next();
    } catch (error) {
        res.cookie("token2","")
        return res.status(401).json({ message: "something went wrong." })
    }
}