const { boolean, bool, number, required } = require('joi');
const mongoose = require('mongoose');





const OrderSchema = new mongoose.Schema({
    Order_id: { type: String, required: true },
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
        price_per_one: { type: Number, required: true, default: 0 },
        price_per_item: { type: Number, required: true },
    }],
    total_price: {
        type: Number,
        required: true,
        default: 0
    },
    address: { type: String, required: true },
    type_pay: { type: Number, required: true },
    status: { type: Number, required: true, default: 0 },




});

const Order = mongoose.model('Order', OrderSchema, 'Order');

module.exports = Order;