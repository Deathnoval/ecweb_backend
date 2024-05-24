const router = require("express").Router();
const categoryController = require('../controller/category');



router.get('/findCategory/:id', categoryController.getCategories);
router.get('/getAllCategories', categoryController.getAllCategories);
router.post('/insertCategory', categoryController.insertCategory);
router.get('/deleteCategory', categoryController.deleteCategory);
router.get('/getAllCategoriesList', categoryController.getAllCategoriesList);
router.get('/getSubCategory/:id', categoryController.getSubCategory);
router.post('/add_primary_category', categoryController.add_primary_category);
router.post('/add_sub_category/:id', categoryController.add_sub_category);
router.post('/update_Catergory', categoryController.update_Catergory);



module.exports = router;
