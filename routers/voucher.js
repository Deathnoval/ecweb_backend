const router = require('express').Router();
const middleware = require('../controller/middleware');
const voucherController = require('../controller/voucher');

router.get('/getReleasedVouchers', middleware.verifyToken, voucherController.getReleasedVouchers);
router.post('/applyVoucher', voucherController.applyVoucher);

module.exports = router;