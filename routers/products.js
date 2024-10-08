const router = require("express").Router();
const productController = require('../controller/product');



router.get('/getAllProductList/:type_get/:value_sort', productController.getProductListALL);
router.get('/getProductDetail/:id', productController.getProductDetail);
router.get('/getProductListALL_with_Sattus/:type_get/:value_sort', productController.getProductListALL_with_Sattus);
router.get("/search", productController.searchProductsByName);

module.exports = router;
