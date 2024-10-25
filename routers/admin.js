const router = require("express").Router();
const categoryController = require('../controller/category');
const productController = require('../controller/product');
const orderController = require('../controller/order');
const middlewareController = require('../controller/middleware');
const userController = require('../controller/users');
const transactionController=require('../controller/transaction')

// Quản lý danh mục (category) - chỉ admin mới có quyền truy cập
router.get('/Admin_get_all_category', middlewareController.verifyToken_ql_product, categoryController.Admin_get_all_category);
router.post('/insertCategory', middlewareController.verifyToken_ql_product, categoryController.insertCategory);
router.post('/deleteCategory', middlewareController.verifyToken_ql_product, categoryController.deleteCategory);
router.post('/add_primary_category', middlewareController.verifyToken_ql_product, categoryController.add_primary_category);
router.post('/add_sub_category', middlewareController.verifyToken_ql_product, categoryController.add_sub_category);
router.post('/update_Catergory', middlewareController.verifyToken_ql_product, categoryController.update_Catergory);
router.post('/update_sub_category', middlewareController.verifyToken_ql_product, categoryController.update_sub_category);
router.post('/delete_sub_category', middlewareController.verifyToken_ql_product, categoryController.delete_sub_category);

// Quản lý sản phẩm (product) - chỉ admin hoặc quản lý sản phẩm mới có quyền truy cập
router.post('/update_onlShop_product', middlewareController.verifyToken_ql_product, productController.update_onlShop_product);
router.post('/update_product', middlewareController.verifyToken_ql_product, productController.update_product);
router.post('/add_product', middlewareController.verifyToken_ql_product, productController.add_product);
router.post('/delete_product', middlewareController.verifyToken_ql_product, productController.delete_product);
router.get('/admin_to_get_product_list/:id', middlewareController.verifyToken_ql_product, productController.admin_to_get_product_list);
router.get('/getProductDetail/:id',middlewareController.verifyToken_ql_product, productController.getProductDetail);

// Quản lý đơn hàng (order) - chỉ admin hoặc quản lý đơn hàng mới có quyền truy cập
router.post('/get_order_detail_to_admin', middlewareController.verifyToken_ql_order, orderController.get_order_detail_to_admin);
router.post('/get_list_detail_admin', middlewareController.verifyToken_ql_order, orderController.get_list_detail_admin);
router.post('/update_status_order', middlewareController.verifyToken_ql_order, orderController.update_status_order);
router.post('/get_OrderHistory_log_admin', middlewareController.verifyToken_ql_order, orderController.get_OrderHistory_log_admin);
router.get('/get_full_order_table', middlewareController.verifyToken_ql_order, orderController.get_full_order_table);
router.post('/refund_momo_money_admin', middlewareController.verifyToken_ql_order, orderController.refund_momo_money_admin);


//admin for user
router.post("/grantRoles",middlewareController.verifyTokenAdmin,userController.grantRoles )
router.get("/find-by-id/:id",middlewareController.verifyToken_ql_user,userController.findUserById);
router.get("/getAllUsers",middlewareController.verifyToken_ql_user, userController.getAllUsers);
router.post("/deleteUser",middlewareController.verifyToken_ql_user, userController.deleteUserAndCart);
router.post("/add_to_blacklist",middlewareController.verifyToken_ql_user, userController.addToBlacklist);
router.get("/getAllBlacklistedEmails",middlewareController.verifyToken_ql_user, userController.getAllBlacklistedEmails);

//admin for transaction
router.get("/getAllTransaction",middlewareController.verifyToken_ql_transaction,transactionController.getAllTransaction)
router.get("/getListTransactionsWithConditions",middlewareController.verifyToken_ql_transaction,transactionController.getTransactionWithCondition)
router.get("/getTransactionsAdd",middlewareController.verifyToken_ql_transaction,transactionController.getTransactionAdd)
router.get("/getTransactionsMinus",middlewareController.verifyToken_ql_transaction,transactionController.getTransactionMinus)



module.exports = router;
