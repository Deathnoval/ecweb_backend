const mongoose = require('mongoose');

const productSchema =mongoose.Schema({
    ho : String,
    ten: String,
    gender: String,
    birthday:String,
    email: String,
    password: String,
    
})

exports.Product=mongoose.model('Product',productSchema,"products")
