const { string } = require('joi');
const Category = require('../models/category');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const req = require('express/lib/request');


function generateCategoryId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let id = '';
  for (let i = 0; i < 3; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}



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


const getAllCategoriesList = async (req, res) => {
  try {
    const categories = await Category.find().populate('sub_category');
    if (categories) {
      const formattedData = categories.map(category => ({
        key: category.category_id, // Convert _id from ObjectId to string
        label: category.name, // Assuming 'icon' property exists

      }))
      console.log(formattedData)

      res.json({ success: true, formattedData });
    }
  }
  catch (err) {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
  }
};
const getSubCategory = async (req, res) => {
  const { id } = req.params; // Lấy id từ URL
  try {
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
  catch (err) {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
  }
};

const add_primary_category = async (req, res) => {
  try {
    let new_name_category = req.body.name;
    console.log("new_name_category:" + new_name_category);
    if (new_name_category.length == 0) {
      return res.json({ success: false, message: "Tên của danh mục không được để trống", color: "text-red-500" })
    }
    const existingCategory = await Category.findOne({ name: new_name_category });
    if (existingCategory) {
      return res.json({ success: false, message: "Tên của danh mục đã tồn tại", color: "text-red-500" })
    } else {
      const new_route = `xem-tat-ca-${new_name_category.toLowerCase().replace(/ /g, '-')}`;
      let new_category_id;
      do {
        new_category_id = generateCategoryId();
        console.log(new_category_id);
      } while (await Category.findOne({ category_id: new_category_id }));

      const newCategory = Category({ name: new_name_category, category_id: new_category_id, route: new_route, sub_category: [] });
      await newCategory.save();
      res.json({ success: true, message: "Thêm Danh mục chính thành công", color: "text-green-500" })
    }

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })

  }


}
const add_sub_category = async (req, res) => {
  try {
    const { id } = req.params;
    const new_name_sub_category = req.body.name_sub_category
    console.log("new_name_sub_category:" + new_name_sub_category);
    if (new_name_sub_category.length == 0) {
      return res.json({ success: false, message: "Tến danh mục phụ không được để trống", color: "text-red-500" });
    }
    else {
      const category = await Category.findOne({ category_id: id });
      if (!category) {
        return res.json({ success: false, message: "Category_id không tồn tại", color: "text-red-500" });
      }
      else {
        const new_route = `xem-tat-ca-${new_name_sub_category.toLowerCase().replace(/ /g, '-')}`;
        let new_sub_category_id;
        do {
          new_sub_category_id = generateCategoryId();
          console.log(new_sub_category_id);
        } while (category.sub_category.find(sub => sub.sub_category_id === new_sub_category_id));
        category.sub_category.push({ sub_category_id: new_sub_category_id, name: new_name_sub_category, route: new_route });
        await category.save();
        res.json({
          success: true,
          message: "Thêm danh mục phụ thành công",
          color: "text-green-500"
        })
      }
    }

  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", colo: "text-red-500" });
  }
}


const update_Catergory = async (req, res) => {
  const { new_name_category, category_id } = req.body
  try {
    const is_not_exists_category = await Category.find({ category_id: category_id })
    if (!is_not_exists_category) {
      return res.json({ success: false, message: "Không tìm thấy danh mục", colo: "text-red-500" });
    }
    else if (new_name_category.length == 0) {
      return res.json({ success: false, message: "Tên danh mục không được để trống", color: "text-red-500" });
    }
    else {
      const updateCategory = await Category.findOneAndUpdate({ category_id: category_id }, { name: new_name_category }, { new: true });
      if (!updateCategory) {
        console.log("lỗi update category");
      }
      else {
        return res.json({ success: true, message: "Cập nhật tên danh mục thành công", color: "text-green-500" });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", colo: "text-red-500" });
  }
}

const deleteCategory = async (req, res) => { };


module.exports = {
  getCategories,
  getAllCategories,
  insertCategory,
  deleteCategory,
  getAllCategoriesList,
  getSubCategory,
  add_primary_category,
  add_sub_category,
  update_Catergory
};