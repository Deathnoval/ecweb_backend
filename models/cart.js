const { boolean, bool, number } = require('joi');
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    items: [{
        product_id: {
            type: String,
            required: true,
            trim: true
        },
        product_name: {
            type: String,
            required: true,
            trim: true

        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        color: {
            type: String,
            trim: true
        },
        size: {
            type: String,
            trim: true
        },
        image_hover: {
            type: String,
            required: true,
            trim: true
        },
        code: { type: String, 
            required: true ,
            trim: true
        },
        selected_buy: {
            type: Boolean,
            required: true,
            default: true,
        },
        price_per_one: { type: Number, required: true, default: 0 },
        price_per_item: { type: Number, required: true },
    }],
    total_price: {
        type: Number,
        required: true,
        default: 0
    }



});

const Cart = mongoose.model('Cart', cartSchema, 'Cart');

module.exports = Cart;