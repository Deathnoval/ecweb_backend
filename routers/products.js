const router = require("express").Router();
const productController = require('../controller/product');



router.get('/getAllProductList/:type_get/:value_sort', productController.getProductListALL);
router.get('/getProductDetail/:id', productController.getProductDetail);
router.get('/getProductListALL_with_Sattus/:type_get/:value_sort', productController.getProductListALL_with_Sattus);
router.post('/update_onlShop_product',productController.update_onlShop_product)
router.post('/add_product',productController.add_product);
router.post('/delete_product',productController.delete_product);

module.exports = router;
