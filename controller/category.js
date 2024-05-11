const { string } = require('joi');
const Category = require('../models/category');
const mongoose = require('mongoose');
const req = require('express/lib/request');

const getCategories = async (req, res) => {
    const { id } = req.params; // Lấy id từ URL
    
    try {
        
        
        // Thay đổi: Sử dụng findOne với điều kiện lọc sub_category
        const category = await Category.findOne({
          category_id:id,
        });
        if (category) {
            // Convert the category and sub_category data to the desired JSON format
            const formattedSubCategories  = category.sub_category.map(subCategory => ({
              key: subCategory.sub_category_id, // Convert _id from ObjectId to string
              icon:'',
              children:'', // Assuming sub-categories don't have nested children
              label: subCategory.name, // Assuming 'name' property holds the label
              route: subCategory.route,
              type: '' // Adjust according to your data structure
            }));
            console.log(formattedSubCategories )
            const formattedData={
              key: category.category_id, // Convert _id from ObjectId to string
              icon:'', // Assuming category doesn't have an icon
              children: formattedSubCategories , // Nested sub-categories under the category
              label: category.name, // Assuming 'name' property holds the label
              type: '' // Adjust according to your data structure
            };
            console.log(formattedData)
            res.json({success:true,formattedData,color: "text-green-500"});
          } else {
            res.json({success:false,message:"Không tìm thấy category",color:"text-red-500"})
          }
      }
      
     catch (error) {
      console.error(error);
      res.json({success:false,message:"Lỗi truy xuất dữ liệu",color:"text-red-500"})
    }
  };
const getAllCategories=async(req,res)=>
{
    try{
        const categories = await Category.find().populate('sub_category');

        console.log(categories)
        if(categories)
        {
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
                })),
                label: category.name, // Assuming 'name' property holds the label
                
                type: '' // Adjust according to your data structure
              }));
        
            console.log(formattedData)
            res.json({success:true,formattedData,color: "text-green-500"});
        }
    }
    catch(err)
    {
        console.error(error);
        res.json({success:false,message:"Lỗi truy xuất dữ liệu",color:"text-red-500"})
    }
    
};
const insertCategory=async(req,res)=>{};

const deleteCategory=async(req,res)=>{};

module.exports = {
  getCategories,
  getAllCategories,
  insertCategory,
  deleteCategory
};