const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    name: String,
    code: String,
    status: {
        type: String,
        default: "unreleased",
        trim: true,
    },
    discount: Number,
    minPrice: Number,
    type:  { type: String,trim: true },
    createdAt: Number,
    expiredAt: Number,
    userId: [
        {type: String, trim: true, default: []}
    ]
});

const Voucher = mongoose.model('Voucher', voucherSchema, "Voucher");

module.exports = Voucher;

