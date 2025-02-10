const router = require('express').Router();
const voucherController = require('../controller/voucher');

router.get('/getReleasedVouchers', voucherController.getReleasedVouchers);
router.post('/applyVoucher', voucherController.applyVoucher);

module.exports = router;