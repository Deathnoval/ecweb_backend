const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
    ho: {
        type: String,
        required: true,
    },
    ten: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    birthday: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    verified: { type: Boolean, default: false },
    address: [
        {
            name: {
                type: String,
                require: true,
            },
            street: { type: String, require: true, },
            number: { type: String, require: true, },
            isDefault: { type: Boolean, default: false },
        }
    ]



});
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY, {
        expiresIn: "7d",
    });
    return token;
};

const User = mongoose.model('User', userSchema, "Users");

const validate = (data) => {
    const schema = Joi.object({
        ho: Joi.string().required().label("ho"),
        ten: Joi.string().required().label("ten"),
        gender: Joi.string().required().label("gender"),
        birthday: Joi.string().required().label("birthday"),
        email: Joi.string().email().required().label("email"),
        password: passwordComplexity().required().label("password"),
    });
    return schema.validate(data);
};

module.exports = { User, validate };
// userSchema.virtual('id').get(function () {
//     return this.id.toHexString();
// });

// userSchema.set('toJSON', {
//     virtual: true,
// });

// exports.User=mongoose.model('User',userSchema,"Users")
// exports.userSchema=userSchema;