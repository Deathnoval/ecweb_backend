const schedule = require('node-schedule');
const Voucher = require('../models/voucher');
const voucherStatus = require('../helpers/constant').voucherStatus;

const updateExpiredVouchers = async () => {
    const vouchers = await Voucher.find({ status: voucherStatus.RELEASED, expiredAt: { $lte:  new Date().getTime() } });
    console.log(new Date().getTime());
    console.log(vouchers);
    for (const voucher of vouchers) {
        voucher.status = voucherStatus.EXPIRED;
        await voucher.save();
    }
}

module.exports = {
    updateExpiredVouchers,
}