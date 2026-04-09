const express = require('express');
const router = express.Router();
const userModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { registerUser, loginUser, logoutUser, getMe, updateMyProfile } = require('../controllers/authController')
const isLoggedIn = require('../middlewares/isLoggedIn')

// router.get("/", (req, res)=>{
//     res.send("Hey user")
// })

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/logout", logoutUser)
router.get("/get-me", isLoggedIn, getMe)
router.patch('/profile', isLoggedIn, updateMyProfile)



module.exports = router