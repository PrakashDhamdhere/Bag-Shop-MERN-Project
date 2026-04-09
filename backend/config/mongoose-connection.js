const mongoose = require('mongoose');
// const dbgr = require('debug')("development:mongoose");

mongoose
.connect(`${process.env.MONGO_URI}/bag-shop`)
.then(()=>{
    console.log("mongodb connected...")
})
.catch((err)=>{
    console.log(err)
})

module.exports = mongoose.connection;