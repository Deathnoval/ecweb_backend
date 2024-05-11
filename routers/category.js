const router = require("express").Router();
const categoryController = require('../controller/category');



router.get('/findCategory/:id', categoryController.getCategories);
router.get('/getAllCategories',categoryController.getAllCategories);
router.get('/insertCategory',categoryController.insertCategory);
router.get('/deleteCategory',categoryController.deleteCategory);



module.exports = router;
