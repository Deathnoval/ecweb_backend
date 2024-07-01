const { status, type } = require('express/lib/response');
const { boolean, bool, number, required } = require('joi');
const mongoose = require('mongoose');

const OrderHistorySchema = new mongoose.Schema({
    Order_id: { type: String, required: true },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    status_history: [{
        status: { type: Number, required: true },
        day_add: { type: Date, required: true }
    }]



});

const OrderHistory = mongoose.model('OrderHistory', OrderHistorySchema, 'OrderHistory');

module.exports = OrderHistory;