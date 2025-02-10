const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    name: String,
    code: String,
    status: {
        type: String,
        default: "unreleased",
    },
    discount: Number,
    minPrice: Number,
    type: String,
    createdAt: Number,
    expiredAt: Number,
});

const Voucher = mongoose.model('Voucher', voucherSchema, "Voucher");

module.exports = Voucher;

