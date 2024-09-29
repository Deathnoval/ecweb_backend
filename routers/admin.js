const router = require("express").Router();
const categoryController = require('../controller/category');
const productController = require('../controller/product');
const orderController = require('../controller/order');
const middlewareController = require('../controller/middleware');
const userController=require('../controller/users')

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
// router.get('/admin_to_get_product_list/:id', productController.admin_to_get_product_list);


router.post('/get_order_detail_to_admin', middlewareController.verifyTokenAdmin, orderController.get_order_detail_to_admin);
router.post('/get_list_detail_admin', middlewareController.verifyTokenAdmin, orderController.get_list_detail_admin);
router.post('/update_status_order', middlewareController.verifyTokenAdmin, orderController.update_status_order);
router.post('/get_OrderHistory_log_admin', middlewareController.verifyTokenAdmin, orderController.get_OrderHistory_log_admin);
router.post('/get_full_order_table', middlewareController.verifyTokenAdmin, orderController.get_full_order_table)
router.post('/refund_momo_money_admin',middlewareController.verifyTokenAdmin,orderController.refund_momo_money_admin)


//admin for user

router.post("/grant-admin/:id",middlewareController.verifyTokenAdmin,userController.grantAdmin )
router.get("/find-by-id",middlewareController.verifyTokenAdmin,userController.findUserById);
router.get("/getAllUsers",middlewareController.verifyTokenAdmin, userController.getAllUsers);
router.post("/deleteUser/:id",middlewareController.verifyTokenAdmin, userController.deleteUserAndCart);
router.post("/add_to_blacklist",middlewareController.verifyTokenAdmin, userController.addToBlacklist);


module.exports = router;
