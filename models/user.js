const mongoose = require('mongoose');

const userSchema =mongoose.Schema({
    ho : String,
    ten: String,
    gender: String,
    birthday:String,
    email: String,
    password: String,
    
})

exports.User=mongoose.model('User',userSchema,"Users")
