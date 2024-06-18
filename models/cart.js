const { boolean, bool } = require('joi');
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
        },
        product_name: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        color: {
            type: String,
        },
        size: {
            type: String,
        },
        image_hover: {
            type: String,
            required: true,
        },
        code: { type: String, required: true },
        selected_buy: {
            type: Boolean,
            required: true,
            default: true,
        },
        price_per_one: { type: String, required: true, default: 0 }
    }],
    total_price: {
        type: Number,
        required: true,
        default: 0
    }



});

const Cart = mongoose.model('Cart', cartSchema, 'Cart');

module.exports = Cart;