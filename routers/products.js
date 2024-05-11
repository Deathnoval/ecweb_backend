const router = require("express").Router();
const productController = require('../controller/product');



router.get('/getAllProductList/:type_get/:value_sort', productController.getProductListALL);


module.exports = router;
