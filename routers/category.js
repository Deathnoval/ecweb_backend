const router = require("express").Router();
const categoryController = require('../controller/category');



router.get('/findCategory/:id', categoryController.getCategories);
router.get('/getAllCategories', categoryController.getAllCategories);
router.get('/insertCategory', categoryController.insertCategory);
router.get('/deleteCategory', categoryController.deleteCategory);
router.get('/getAllCategoriesList',categoryController.getAllCategoriesList)
router.get('/getSubCategory/:id',categoryController.getSubCategory)



module.exports = router;
