const router = require("express").Router();
const categoryController = require('../controller/category');



router.get('/findCategory/:id', categoryController.getCategories);
router.get('/getAllCategories', categoryController.getAllCategories);

router.get('/getAllCategoriesList', categoryController.getAllCategoriesList);
router.get('/getSubCategory/:id', categoryController.getSubCategory);

router.get('/admin/Admin_get_all_category',categoryController.Admin_get_all_category);



module.exports = router;
