const router = require("express").Router();
const cartController = require('../controller/order');
const middlewareController = require('../controller/middleware');

router.post('/add_order', middlewareController.verifyToken, cartController.add_order);


module.exports = router;