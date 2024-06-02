const router = require("express").Router();
const categoryController = require('../controller/category');
const productController = require('../controller/product');
const middlewareController = require('../controller/middleware');

//admin for category
router.get('/Admin_get_all_category', categoryController.Admin_get_all_category);
router.post('/insertCategory', middlewareController.verifyTokenAdmin, categoryController.insertCategory);
router.post('/deleteCategory', middlewareController.verifyTokenAdmin, categoryController.deleteCategory);
router.post('/add_primary_category', middlewareController.verifyTokenAdmin, categoryController.add_primary_category);
router.post('/add_sub_category', middlewareController.verifyTokenAdmin, categoryController.add_sub_category);
router.post('/update_Catergory', middlewareController.verifyTokenAdmin, categoryController.update_Catergory);
router.post('/update_sub_category', middlewareController.verifyTokenAdmin, categoryController.update_sub_category);
router.post('/delete_sub_category', middlewareController.verifyTokenAdmin, categoryController.delete_sub_category);



//admin for product
router.post('/update_onlShop_product', middlewareController.verifyTokenAdmin, productController.update_onlShop_product)
router.post('/update_product', middlewareController.verifyTokenAdmin, productController.update_product)

router.post('/add_product', middlewareController.verifyTokenAdmin, productController.add_product);
router.post('/delete_product', middlewareController.verifyTokenAdmin, productController.delete_product);
router.get('/admin_to_get_product_list/:id', productController.admin_to_get_product_list);
router.get('/admin_to_get_product_list/:id', productController.admin_to_get_product_list);


module.exports = router;
