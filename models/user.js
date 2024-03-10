const mongoose = require('mongoose');

const userSchema =new mongoose.Schema({
    ho : {
        type: String,
        required: true,
    },
    ten:  {
        type: String,
        required: true,
    },
    gender:  {
        type: String,
        required: true,
    },
    birthday: {
        type: String,
        required: true,
    },
    email:  {
        type: String,
        required: true,
    },
    password:  {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    
    
});

userSchema.virtual('id').get(function () {
    return this.id.toHexString();
});

userSchema.set('toJSON', {
    virtual: true,
});

exports.User=mongoose.model('User',userSchema,"Users")
exports.userSchema=userSchema;