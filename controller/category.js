const { string } = require('joi');
const Category = require('../models/category');
const mongoose = require('mongoose');
const req = require('express/lib/request');

const getCategories = async (req, res) => {
  const { id } = req.params; // Lấy id từ URL

  try {


    // Thay đổi: Sử dụng findOne với điều kiện lọc sub_category
    const category = await Category.findOne({
      category_id: id,
    });
    if (category) {
      // Convert the category and sub_category data to the desired JSON format
      const formattedSubCategories = category.sub_category.map(subCategory => ({
        key: subCategory.sub_category_id, // Convert _id from ObjectId to string
        icon: '',
        children: '', // Assuming sub-categories don't have nested children
        label: subCategory.name, // Assuming 'name' property holds the label
        route: subCategory.route,
        type: '' // Adjust according to your data structure
      }));
      console.log(formattedSubCategories)
      const formattedData = {
        key: category.category_id, // Convert _id from ObjectId to string
        icon: '', // Assuming category doesn't have an icon
        children: formattedSubCategories, // Nested sub-categories under the category
        label: category.name, // Assuming 'name' property holds the label
        type: '' // Adjust according to your data structure
      };
      console.log(formattedData)
      res.json({ success: true, formattedData });
    } else {
      res.json({ success: false, message: "Không tìm thấy category", color: "text-red-500" })
    }
  }

  catch (error) {
    console.error(error);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
  }
};
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('sub_category');

    if (categories) {
      const formattedData = categories.map(category => ({
        key: category.category_id, // Convert _id from ObjectId to string
        icon: '', // Assuming 'icon' property exists
        children: category.sub_category.map(subCategory => ({
          key: subCategory.sub_category_id, // Convert _id from ObjectId to string
          icon: '', // Assuming 'icon' property exists
          children: null, // Assuming sub-categories don't have nested children
          label: subCategory.name, // Assuming 'name' property holds the label
          route: subCategory.route,
          type: '' // Adjust according to your data structure
        })).concat({
          key: category.category_id, // Convert _id from ObjectId to string
          icon: '', // Assuming 'icon' property exists
          children: null, // Assuming sub-categories don't have nested children
          label: "Xem Tất Cả " + category.name, // Assuming 'name' property holds the label
          route: category.route,
          type: ''
        }),
        label: category.name, // Assuming 'name' property holds the label
        type: '' // Adjust according to your data structure
      }));
      console.log(formattedData)

      res.json({ success: true, formattedData });
    }
  }
  catch (err) {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
  }

};
const insertCategory = async (req, res) => {
  try {
    const newCategory = await Category({
      name: req.body.name,
      route: req.body.route,
      category_id: shortid.generate(),
      sub_category: req.body.sub_category.map(subCategory => ({
        sub_category_id: shortid.generate(),
        name: subCategory.name,
        route: subCategory.route,

      })),

    });
    await newCategory.save();
    res.json({ success: true, message: 'Category inserted successfully', color: 'text--green-500' });
    console.log(newCategory);
  } catch (err) {
    console.log(err);
    if (err.code === 11000) { // Duplicate key error (unique constraint violation)
      errorMessage = 'Unique constraint violation. Name, route, category_id, or sub_category_id might already exist.';
    }
    let errorMessage = 'Error creating category';
    res.status(400).json({
      success: false,
      message: errorMessage,
      color: 'text-red-500'
    });
  }
};


const getAllCategoriesList=async(req,res)=>{
  try{
    const categories = await Category.find().populate('sub_category');
    if (categories)
    {
      const formattedData = categories.map(category => ({
        key: category.category_id, // Convert _id from ObjectId to string
        label: category.name, // Assuming 'icon' property exists
        
        }))
      console.log(formattedData)

      res.json({ success: true, formattedData });
    }
  }
  catch(err)
  {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
  }
};
const getSubCategory=async(req,res)=>{
  const { id } = req.params; // Lấy id từ URL
  try{
    const category = await Category.findOne({
      category_id: id,
    });
    if (category) {
      // Convert the category and sub_category data to the desired JSON format
      const formattedSubCategories = category.sub_category.map(subCategory => ({
        key: subCategory.sub_category_id, // Convert _id from ObjectId to string
        label: subCategory.name, // Assuming 'name' property holds the label
        
      }));
      console.log(formattedSubCategories)
      res.json({ success: true, formattedSubCategories });
    }
  }
  catch(err)
  {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
  }
};

const deleteCategory = async (req, res) => { };
 

module.exports = {
  getCategories,
  getAllCategories,
  insertCategory,
  deleteCategory,
  getAllCategoriesList,
  getSubCategory
};