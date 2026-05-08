const userModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const generateToken = require('../utils/generateToken')
const { blacklistToken } = require('../utils/tokenBlacklist')

const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
}

module.exports.registerUser = async (req, res)=>{
    let {email, password, fullname} = req.body;
    let user = await userModel.findOne({email})
    if(user){
        res.status(404).json({
            message: "User Already Exist"
        })
    } else {
        bcrypt.genSalt(12, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
                if(err){
                    res.status(400).json({
                        message: err.message
                    });
                } else {
                    let newUser = await userModel.create({
                        email,
                        password: hash,
                        fullname,
                    })
                    res.status(201).json({
                        message: "Account created successfully. You can now LogIn"
                    })
                }
            });
        });
    }
}

module.exports.loginUser = async (req, res)=>{
    const {email, password} = req.body;
    let user = await userModel.findOne({email})
    if(user){
        bcrypt.compare(password, user.password, function(err, result) {
            if(err){
                res.send(err)
            } else {
                if(result){
                    // set the cookie
                    let token = generateToken(user)
                    res.cookie("token", token, cookieOptions)
                    res.status(200).json({
                        message: "Logged in successfully",
                        user
                    })
                } else {
                    res.status(404).json({
                        message: "Email or Password is wrong"
                    })
                }
            }
        });
    } else {
        // res.send("Email or Password is Wrong")
        res.status(404).json({
            message: "Email or Password is wrong"
        })
    }
}

module.exports.logoutUser = async (req, res)=>{
    const token = req.cookies?.token;
    try {
        await blacklistToken(token);
    } catch {
        // If blacklist persistence fails, still clear cookie and logout.
    }

    res.cookie("token", "", { ...cookieOptions, maxAge: 0 })
    res.status(200).json({
        message: "Logged out successfully"
    })
}

module.exports.getMe = async (req, res)=>{
    const user = await userModel.findOne({email: req.user.email}).select("-password");
    res.status(200).json({
        user
    })
}

module.exports.updateMyProfile = async (req, res)=>{
    try {
        const allowedFields = [
            'fullname',
            'contact',
            'address',
            'city',
            'state',
            'pincode',
            'country',
            'profileImage',
            'pictuer',
        ];

        const updateDoc = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateDoc[field] = req.body[field];
            }
        }

        if (Object.keys(updateDoc).length === 0) {
            return res.status(400).json({ message: 'No profile fields provided' });
        }

        const user = await userModel.findByIdAndUpdate(
            req.user._id,
            updateDoc,
            { new: true, runValidators: true }
        ).select('-password');

        return res.status(200).json({
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}