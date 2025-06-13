const { string } = require("joi");
const Category = require("../models/category");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const req = require("express/lib/request");
const Product = require("../models/product");

function generateCategoryId() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let id = "";
  for (let i = 0; i < 3; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const Admin_get_all_category = async (req, res) => {
  try {
    let category = await Category.find();
    let formatted = category;

    const check_undefined_product = await Product.findOne({
      category_id: "undefined",
    });

    // console.log(check_undefined_product)
    if (check_undefined_product != null) {
      const formatted_product = {
        name: "Tồn Kho",
        category_id: "undefined",
        route: "xem-tat-ca-tồn-kho",
        sub_category: [],
      };
      formatted = formatted.concat(formatted_product);
    }
    const productsWithUndefinedSubCategory = await Product.find({
      sub_category_id: "undefined",
    });

    for (const product of productsWithUndefinedSubCategory) {
      const categoryId = product.category_id;

      // Check if there's already a sub-category with undefined sub_category_id in formattedCategories
      const existingUndefinedSubCategory = formatted.find(
        (category) => {
          return (
            category.category_id === categoryId &&
            category.sub_category.some(
              (subCategory) => subCategory.sub_category_id === "undefined"
            )
          );
        }
      );

      if (!existingUndefinedSubCategory) {
        // Add a new sub-category with undefined sub_category_id to formattedCategories
        console.log("check")
        const categoryIndex = formatted.findIndex(
          (category) => category.category_id === categoryId
        );
        if (categoryIndex !== -1) {
          formatted[categoryIndex].sub_category.push({
            name: "Chưa có danh mục chính",
            sub_category_id: "undefined",
            route: ""
          });
        }
      }
    }
    // console.log(formatted)
    category = formatted;
    return res.status(200).json({ success: true, category });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const getCategories = async (req, res) => {
  const { id } = req.params; // Lấy id từ URL

  try {
    // Thay đổi: Sử dụng findOne với điều kiện lọc sub_category
    const category = await Category.findOne({
      category_id: id,
    });
    if (category) {
      // Convert the category and sub_category data to the desired JSON format
      const formattedSubCategories = category.sub_category.map(
        (subCategory) => ({
          key: subCategory.sub_category_id, // Convert _id from ObjectId to string
          icon: "",
          children: "", // Assuming sub-categories don't have nested children
          label: subCategory.name, // Assuming 'name' property holds the label
          route: subCategory.route,
          type: "", // Adjust according to your data structure
        })
      );
      console.log(formattedSubCategories);
      const formattedData = {
        key: category.category_id, // Convert _id from ObjectId to string
        icon: "", // Assuming category doesn't have an icon
        children: formattedSubCategories, // Nested sub-categories under the category
        label: category.name, // Assuming 'name' property holds the label
        type: "", // Adjust according to your data structure
      };
      console.log(formattedData);
      res.status(200).json({ success: true, formattedData });
    } else {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
        color: "text-red-500",
      });
    }
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("sub_category");

    if (categories) {
      const formattedData = categories.map((category) => ({
        key: category.category_id, // Convert _id from ObjectId to string
        icon: "", // Assuming 'icon' property exists
        children: category.sub_category
          .map((subCategory) => ({
            key: subCategory.sub_category_id, // Convert _id from ObjectId to string
            icon: "", // Assuming 'icon' property exists
            children: null, // Assuming sub-categories don't have nested children
            label: subCategory.name, // Assuming 'name' property holds the label
            route: subCategory.route,
            type: "", // Adjust according to your data structure
          }))
          .concat({
            key: category.category_id, // Convert _id from ObjectId to string
            icon: "", // Assuming 'icon' property exists
            children: null, // Assuming sub-categories don't have nested children
            label: "Xem Tất Cả " + category.name, // Assuming 'name' property holds the label
            route: category.route,
            type: "",
          }),
        label: category.name, // Assuming 'name' property holds the label
        type: "", // Adjust according to your data structure
      }));
      console.log(formattedData);

      res.status(200).json({ success: true, formattedData });
    }
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const insertCategory = async (req, res) => {
  try {
    const newCategory = await Category({
      name: req.body.name,
      route: req.body.route,
      category_id: shortid.generate(),
      sub_category: req.body.sub_category.map((subCategory) => ({
        sub_category_id: shortid.generate(),
        name: subCategory.name,
        route: subCategory.route,
      })),
    });
    await newCategory.save();
    res.json({
      success: true,
      message: "Category inserted successfully",
      color: "text--green-500",
    });
    console.log(newCategory);
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      // Duplicate key error (unique constraint violation)
      errorMessage =
        "Unique constraint violation. Name, route, category_id, or sub_category_id might already exist.";
    }
    let errorMessage = "Error creating category";
    res.json({
      success: false,
      message: errorMessage,
      color: "text-red-500",
    });
  }
};

const getAllCategoriesList = async (req, res) => {
  try {
    const categories = await Category.find().populate("sub_category");
    if (categories) {
      const formattedData = categories.map((category) => ({
        key: category.category_id, // Convert _id from ObjectId to string
        label: category.name, // Assuming 'icon' property exists
      }));
      console.log(formattedData);

      res.status(200).json({ success: true, formattedData });
    }
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
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
      const formattedSubCategories = category.sub_category.map(
        (subCategory) => ({
          key: subCategory.sub_category_id, // Convert _id from ObjectId to string
          label: subCategory.name, // Assuming 'name' property holds the label
        })
      );
      console.log(formattedSubCategories);
      res.status(200).json({ success: true, formattedSubCategories });
    } else {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
        color: "text-red-500",
      });
    }

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const add_primary_category = async (req, res) => {
  try {
    let new_name_category = req.body.name;
    console.log("new_name_category:" + new_name_category);
    if (new_name_category.length == 0) {
      return res.status(500).json({
        success: false,
        message: "Tên của danh mục không được để trống",
        color: "text-red-500",
      });
    }
    const existingCategory = await Category.findOne({
      name: new_name_category,
    });
    if (existingCategory) {
      return res.status(500).json({
        success: false,
        message: "Tên của danh mục đã tồn tại",
        color: "text-red-500",
      });
    } else {
      const new_route = `xem-tat-ca-${new_name_category
        .toLowerCase()
        .replace(/ /g, "-")}`;
      let new_category_id;
      do {
        new_category_id = generateCategoryId();
        console.log(new_category_id);
      } while (await Category.findOne({ category_id: new_category_id }));

      const newCategory = Category({
        name: new_name_category,
        category_id: new_category_id,
        route: new_route,
        sub_category: [],
      });
      await newCategory.save();
      res.status(200).json({
        success: true,
        message: "Thêm Danh mục chính thành công",
        color: "text-green-500",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const add_sub_category = async (req, res) => {
  try {
    const id = req.body.id;
    const new_name_sub_category = req.body.name_sub_category;
    console.log("new_name_sub_category:" + new_name_sub_category);
    if (new_name_sub_category.length == 0) {
      return res.status(500).json({
        success: false,
        message: "Tến danh mục phụ không được để trống",
        color: "text-red-500",
      });
    } else {
      const category = await Category.findOne({ category_id: id });
      if (!category) {
        return res.status(500).json({
          success: false,
          message: "Category_id không tồn tại",
          color: "text-red-500",
        });
      } else {
        const new_route = `xem-tat-ca-${new_name_sub_category
          .toLowerCase()
          .replace(/ /g, "-")}`;
        let new_sub_category_id;
        do {
          new_sub_category_id = generateCategoryId();
          console.log(new_sub_category_id);
        } while (
          category.sub_category.find(
            (sub) => sub.sub_category_id === new_sub_category_id
          )
        );
        category.sub_category.push({
          sub_category_id: new_sub_category_id,
          name: new_name_sub_category,
          route: new_route,
        });
        await category.save();
        res.status(200).json({
          success: true,
          message: "Thêm danh mục phụ thành công",
          color: "text-green-500",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      colo: "text-red-500",
    });
  }
};

const update_Catergory = async (req, res) => {
  const new_name_category = req.body.name;
  const category_id = req.body.category_id;
  try {
    const is_not_exists_category = await Category.findOne({
      category_id: category_id,
    });
    console.log(is_not_exists_category);
    if (!is_not_exists_category) {
      return res.status(500).json({
        success: false,
        message: "Không tìm thấy danh mục",
        colo: "text-red-500",
      });
    } else if (new_name_category.length == 0) {
      return res.status(500).json({
        success: false,
        message: "Tên danh mục không được để trống",
        color: "text-red-500",
      });
    } else {
      const new_route = `xem-tat-ca-${new_name_category
        .toLowerCase()
        .replace(/ /g, "-")}`;
      const updateCategory = await Category.findOneAndUpdate(
        { category_id: category_id },
        {
          name: new_name_category,
          route: new_route,
        },
        { new: true }
      );
      if (!updateCategory) {
        return res.status(500).json({
          success: false,
          message: "Cập nhật tên danh mục không thành công",
          color: "text-red-500",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Cập nhật tên danh mục thành công",
          color: "text-green-500",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      colo: "text-red-500",
    });
  }
};

const update_sub_category = async (req, res) => {
  const category_id = req.body.category_id;
  const name = req.body.name;
  const sub_category_id = req.body.sub_category_id;
  try {
    if (name.length > 0) {
      const is_exit_category = await Category.findOne({
        category_id: category_id,
      });
      if (is_exit_category) {
        const is_exit_sub_category = is_exit_category.sub_category.findIndex(
          (sub) => sub.sub_category_id === sub_category_id
        );
        console.log(is_exit_sub_category);
        if (is_exit_sub_category === -1) {
          return res.status(500).json({
            success: false,
            message: "Không tìm thấy danh mục phụ",
            color: "text-red-500",
          });
        } else {
          const new_sub_route = `xem-tat-ca-${name
            .toLowerCase()
            .replace(/ /g, "-")}`;
          is_exit_category.sub_category[is_exit_sub_category].name = name;
          is_exit_category.sub_category[is_exit_sub_category].route =
            new_sub_route;
          await is_exit_category.save();
          return res.status(200).json({
            success: true,
            message: "Cập nhật tên danh mục phụ thành công",
            color: "text-green-500",
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy danh mục chính",
          color: "text-red-500",
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "Tên danh mục phụ không được để  trống",
        color: "text-red-500",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const deleteCategory = async (req, res) => {
  const category_id = req.body.category_id;
  try {
    const is_exit_category = await Category.findOne({
      category_id: category_id,
    });
    if (!is_exit_category) {
      return res.status(500).json({
        success: false,
        message: "Không tìm thấy danh mục cần xóa",
        color: "text-red-500",
      });
    } else {
      const is_exit_product_with_category = await Product.find({
        category_id: category_id,
      });
      console.log(is_exit_product_with_category);
      if (is_exit_product_with_category.length > 0) {
        const productIdsToUpdate = is_exit_product_with_category.map(
          (product) => product.product_id
        );
        const check_update = await Product.updateMany(
          { product_id: { $in: productIdsToUpdate } },
          { $set: { category_id: "undefined", sub_category_id: "undefined", onlShop: false } }
        );
        if (check_update) {
          const check_success = await Category.deleteOne({
            category_id: category_id,
          });
          if (check_success) {
            return res.status(200).json({
              success: true,
              message: "Xóa danh mục thành công",
              color: "text-green-500",
            });
          } else {
            return res.status(500).json({
              success: false,
              message: "Xóa danh mục thất bại",
              color: "text-red-500",
            });
          }
        } else {
          return res.status(500).json({
            success: false,
            message:
              "Xóa danh mục thất bại do không thể thay đổi id của sản phẩm",
            color: "text-red-500",
          });
        }
      } else {
        const check_success = await Category.deleteOne({
          category_id: category_id,
        });
        if (check_success) {
          return res.status(200).json({
            success: true,
            message: "Xóa danh mục thành công",
            color: "text-green-500",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Xóa danh mục thất bại",
            color: "text-red-500",
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      colo: "text-red-500",
    });
  }
};
const delete_sub_category = async (req, res) => {
  const category_id = req.body.category_id;
  const sub_category_id = req.body.sub_category_id;
  try {
    const is_exit_category = await Category.findOne({
      category_id: category_id,
    });
    if (!is_exit_category) {
      return res.status(500).json({
        success: false,
        message: "Không tìm thấy danh mục chính",
        color: "text-red-500",
      });
    } else {
      const is_exit_sub_category = is_exit_category.sub_category.findIndex(
        (sub) => sub.sub_category_id === sub_category_id
      );
      if (is_exit_sub_category === -1) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy danh mục phụ",
          color: "text-red-500",
        });
      } else {
        let check_deletion_success = true;
        const is_exit_product_with_sub_category = await Product.find({
          sub_category_id: sub_category_id,
        });
        if (is_exit_product_with_sub_category.length > 0) {
          const productIdsToUpdate = is_exit_product_with_sub_category.map(
            (product) => product.product_id
          );
          const check_update = await Product.updateMany(
            { product_id: { $in: productIdsToUpdate } },
            { $set: { sub_category_id: "undefined", onlShop: false } }
          );
          if (!check_update) {
            check_deletion_success = false;
          }
        }
        is_exit_category.sub_category.splice(is_exit_sub_category, 1);
        await is_exit_category.save().catch((err) => {
          console.log(err);
          check_deletion_success = false;
        });
        if (check_deletion_success) {
          return res.status(200).json({
            success: true,
            message: "Xoá danh mục phụ thành công",
            color: "text-green-500",
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Xoá danh mục phụ không thành công",
            color: "text-red-500",
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

module.exports = {
  getCategories,
  getAllCategories,
  insertCategory,
  deleteCategory,
  getAllCategoriesList,
  getSubCategory,
  add_primary_category,
  add_sub_category,
  update_Catergory,
  update_sub_category,
  delete_sub_category,
  Admin_get_all_category,
};
