const router = require('express').Router();
const middleware = require('../controller/middleware');
const voucherController = require('../controller/voucher');

router.get('/getReleasedVouchers', middleware.verifyToken, voucherController.getReleasedVouchers);
router.post('/applyVoucher', voucherController.applyVoucher);
router.post('/decreaseVoucherLimit', voucherController.decreaseVoucherLimit);


module.exports = router;