const router = require("express").Router();
const orderController = require('../controller/order');
const middlewareController = require('../controller/middleware');

router.post('/add_order', middlewareController.verifyToken, orderController.add_order);
router.post('/get_order_detail', middlewareController.verifyToken, orderController.get_order_detail);
router.get('/get_list_detail_user', middlewareController.verifyToken, orderController.get_list_detail_user);
router.post('/get_OrderHistory_log', middlewareController.verifyToken, orderController.get_OrderHistory_log);
router.post('/momo/notify',middlewareController.verifyToken, orderController.handleMomoNotification);
router.post('/callback', orderController.callback);

// router.post('/get_order_detail_to_admin', middlewareController.verifyToken, orderController.get_order_detail_to_admin);
// router.post('/get_list_detail_user', middlewareController.verifyToken, orderController.get_list_detail_user);
// router.post('/update_status_order', middlewareController.verifyToken, orderController.update_status_order);



module.exports = router;
