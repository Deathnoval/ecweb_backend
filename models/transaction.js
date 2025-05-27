const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    order_id: { type: String, required: true, },
    price_pay: { type: Number, required: true },
    user_id: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    create_date: { type: Date, default: Date.now() },
    createAt: { type: Number, default: Date.now() },
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;