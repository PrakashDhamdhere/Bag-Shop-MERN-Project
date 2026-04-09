const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');
const { isTokenBlacklisted } = require('../utils/tokenBlacklist');

module.exports = async (req, res, next)=>{
    if(!req.cookies.token){
        return res.status(401).json({ message: "you need to login first" })
    }

    try {
        const token = req.cookies.token;
        const isBlacklisted = await isTokenBlacklisted(token);
        if(isBlacklisted){
            res.cookie("token","")
            return res.status(401).json({ message: "session expired. please login again" })
        }

        let decoded = jwt.verify(token, process.env.JWT_KEY);
        let user = await userModel
        .findOne({email: decoded.email})
        .select("-password");
        if(!user){
            res.cookie("token","")
            return res.status(401).json({ message: "you need to login first" })
        }
        req.user = user;
        next();
    } catch (error) {
        res.cookie("token","")
        return res.status(401).json({ message: "something went wrong." })
    }
}