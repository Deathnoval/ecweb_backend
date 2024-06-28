const router = require("express").Router();
const cartController = require('../controller/cart');
const middlewareController = require('../controller/middleware');

router.post('/add_to_cart', middlewareController.verifyToken, cartController.add_to_cart);
router.get('/cart_show', middlewareController.verifyToken, cartController.cart_show);
router.get('/show_number_items_in_cart', middlewareController.verifyToken, cartController.show_number_items_in_cart);
router.post('/delete_items_in_cart', middlewareController.verifyToken, cartController.delete_items_in_cart);
router.post('/update_items_in_cart', middlewareController.verifyToken, cartController.update_items_in_cart);
router.post('/check_out', middlewareController.verifyToken, cartController.check_out);

module.exports = router;