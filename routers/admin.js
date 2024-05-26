const router = require("express").Router();
const categoryController = require('../controller/category');
const productController = require('../controller/product');


//admin for category
router.get('/Admin_get_all_category', categoryController.Admin_get_all_category);
router.post('/insertCategory', categoryController.insertCategory);
router.post('/deleteCategory', categoryController.deleteCategory);
router.post('/add_primary_category', categoryController.add_primary_category);
router.post('/add_sub_category', categoryController.add_sub_category);
router.post('/update_Catergory', categoryController.update_Catergory);
router.post('/update_sub_category', categoryController.update_sub_category);
router.post('/delete_sub_category', categoryController.delete_sub_category);



//admin for product
router.post('/update_onlShop_product', productController.update_onlShop_product)
router.post('/add_product', productController.add_product);
router.post('/delete_product', productController.delete_product);
router.get('/admin_to_get_product_list/:id', productController.admin_to_get_product_list);


module.exports = router;
