const date = require('date-and-time');
const req = require('express/lib/request');
const Product = require('../models/product');
const Category = require('../models/category');
const { string } = require('joi');
const { json } = require('body-parser');
const moment = require('moment-timezone');

function generateProductId() {
    const chars = '1234567890';
    let id = '';
    for (let i = 0; i < 3; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

const getProductListALL = async (req, res) => {
    const type_get = req.params.type_get;
    const value_sort = req.params.value_sort;
    let sortField = "createdAt";
    let sortOrder = "desc";

    if (value_sort == "1") {
        sortField = "price";
        sortOrder = "asc";
    } else if (value_sort == "2") {
        sortField = "price";
        sortOrder = "desc";
    } else if (value_sort == "3") {
        sortField = "name";
        sortOrder = "asc";
    } else if (value_sort == "4") {
        sortField = "name";
        sortOrder = "desc";
    }

    let sortOptions = {};
    sortOptions[sortField] = sortOrder;

    try {
        let productListAll = await Product.find({ total_number: { $gt: 0 }, onlShop: true }).sort(sortOptions);

        if (type_get !== "all") {
            productListAll = await Product.find({
                category_id: type_get,
                total_number: { $gt: 0 },
                onlShop: true
            }).sort(sortOptions);
        }

        const productListAll_DataFormat = productListAll.map(product => ({
            id: product.product_id,
            name: product.name,
            price: product.price,
            image: product.primary_image,
            imageHover: product.image_hover,
            color: product.array_color.map(arrayColor => ({
                name_color: arrayColor.name_color,
                code_color: arrayColor.code_color,
                image: arrayColor.image,
            })),
        }));

        if (productListAll_DataFormat.length > 0) {
            return res.status(200).json({ success: true, productListAll_DataFormat });
        } else {
            return res.status(404).json({ success: false, message: "No products found", color: "text-red-500" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message, color: "text-red-500" });
    }
};

const getProductDetail = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findOne({ product_id: id });

        if (product) {
            return res.status(200).json({ success: true, product });
        } else {
            return res.status(404).json({ success: false, message: "Product not found", color: "text-red-500" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message, color: "text-red-500" });
    }
};

const admin_to_get_product_list = async (req, res) => {
    try {
        const id = req.params.id;
        const sortField = "createDate";
        const sortOrder = 1;
        let sortOptions = {};
        sortOptions[`${sortField}`] = sortOrder;

        let product_list = await Product.find({ category_id: id }).sort({ "createDate.date": 1 });

        if (!(product_list.length > 0)) {
            product_list = await Product.find({ sub_category_id: id }).sort({ "createDate.date": 1 });
        }

        const formatted_product = product_list.map(product => ({
            name: product.name,
            code: product.code,
            price: product.price,
            total_number: product.total_number,
            primary_image: product.primary_image,
            product_id: product.product_id,
            onlShop: product.onlShop,
            createDate: moment(product.createDate).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"),
        }));

        return res.status(200).json({ success: true, formatted_product });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const update_onlShop_product = async (req, res) => {
    const id = req.body.id;
    const onlShop = req.body.onlShop;

    try {
        const check_category_undefined = await Product.findOne({ product_id: id });
        if (!check_category_undefined.category_id || !check_category_undefined.sub_category_id) {
            return res.status(400).json({ success: false, message: "Sản phẩm phải có danh mục chính rõ ràng", color: "text-red-500" });
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { product_id: id },
            { onlShop: onlShop },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm", color: "text-red-500" });
        }

        return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', color: 'text-green-500' });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const add_product = async (req, res) => {
    try {
        let { name, total, price, array_color, array_image, imagePrimaryAndHover, category_id, sub_category_id, description, codeProduct } = req.body;

        if (!name || !price || !total || !array_image || !imagePrimaryAndHover || !category_id || !sub_category_id || !description || !codeProduct) {
            return res.status(400).json({ success: false, message: "Missing required fields", color: "text-red-500" });
        }

        const checkProduct_code = await Product.findOne({ code: codeProduct });
        if (checkProduct_code) {
            return res.status(400).json({ success: false, message: "Product code already exists", color: "text-red-500" });
        }

        let new_product_id;
        do {
            new_product_id = generateProductId();
        } while (await Product.findOne({ product_id: new_product_id }));

        const newProduct = new Product({
            name,
            price,
            total_number: total,
            array_color,
            array_image,
            primary_image: imagePrimaryAndHover.primary_image,
            image_hover: imagePrimaryAndHover.image_hover,
            category_id,
            sub_category_id,
            description,
            product_id: new_product_id,
            createdAt: Date.now(),
            code: codeProduct
        });

        await newProduct.save();
        return res.status(201).json({ success: true, message: "Product added successfully", color: "text-green-500" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message, color: "text-red-500" });
    }
};

const delete_product = async (req, res) => {
    try {
        const product_id = req.body.product_id;
        if (!product_id) {
            return res.status(400).json({ success: false, message: "Không nhận được id của sản phẩm", color: "text-red-500" });
        }

        const product = await Product.findOne({ product_id: product_id });
        if (!product) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm", color: "text-red-500" });
        }

        const check_delete_success = await Product.deleteOne({ product_id: product_id });
        if (check_delete_success) {
            return res.status(200).json({ success: true, message: "Xoá sản phẩm thành công", color: "text-green-500" });
        } else {
            return res.status(500).json({ success: false, message: "Xoá sản phẩm thất bại", color: "text-red-500" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const update_product = async (req, res) => {
    try {
        let { product_id, name, total, price, array_color, array_image, imagePrimaryAndHover, category_id, sub_category_id, description, codeProduct } = req.body;

        total = parseInt(total.trim(), 10);

        if (!name || !price || !total || !array_image || !imagePrimaryAndHover || !category_id || !sub_category_id || !description || !codeProduct || !product_id) {
            return res.status(400).json({ success: false, message: "Missing required fields", color: "text-red-500" });
        }

        const check_product_id = await Product.findOne({ product_id });
        if (!check_product_id) {
            return res.status(404).json({ success: false, message: "ID sản phẩm không tồn tại", color: "text-red-500" });
        }

        if (check_product_id.code !== codeProduct) {
            const checkProduct_code = await Product.findOne({ code: codeProduct });
            if (checkProduct_code) {
                return res.status(400).json({ success: false, message: "Mã sản phẩm đã tồn tại", color: "text-red-500" });
            }
        }

        const checkProduct_category = await Category.findOne({ category_id });
        if (!checkProduct_category) {
            return res.status(400).json({ success: false, message: "Mã danh mục chính sai", color: "text-red-500" });
        }

        const checkProduct_sub_category = checkProduct_category.sub_category.findIndex(sub => sub.sub_category_id === sub_category_id);
        if (checkProduct_sub_category === -1) {
            return res.status(400).json({ success: false, message: "Mã danh mục phụ sai", color: "text-red-500" });
        }

        if (array_color && array_color.length > 0) {
            let total_number = 0;
            let hasMismatchError = false;

            array_color.forEach(color => {
                const total_number_with_color = parseInt(color.total_number_with_color.trim(), 10);
                total_number += total_number_with_color;

                if (color.array_sizes && color.array_sizes.length > 0) {
                    let total_number_with_sizes = 0;

                    color.array_sizes.forEach(size => {
                        total_number_with_sizes += parseInt(size.total_number_with_size, 10);
                    });

                    if (total_number_with_sizes !== total_number_with_color) {
                        hasMismatchError = true;
                    }
                }
            });

            if (hasMismatchError) {
                return res.status(400).json({ success: false, message: "Tổng các size sản phẩm không bằng tổng số lượng màu sản phẩm", color: "text-red-500" });
            }

            if (total_number !== total) {
                return res.status(400).json({ success: false, message: "Tổng các màu sản phẩm không bằng tổng số lượng sản phẩm", color: "text-red-500" });
            }
        }

        const updated_product = await Product.findOneAndUpdate(
            { product_id },
            {
                name,
                price,
                total_number: total,
                array_color,
                array_image,
                primary_image: imagePrimaryAndHover.primary_image,
                image_hover: imagePrimaryAndHover.image_hover,
                category_id,
                sub_category_id,
                description,
                createdAt: Date.now(),
                code: codeProduct
            },
            { new: true }
        );

        if (updated_product) {
            return res.status(200).json({ success: true, message: "Cập nhật sản phẩm thành công", color: "text-green-500" });
        } else {
            return res.status(500).json({ success: false, message: "Cập nhật sản phẩm thất bại", color: "text-red-500" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const searchProductsByName = async (req, res) => {
    const { name } = req.body;

    try {
        const products = await Product.find({ name: { $regex: name, $options: 'i' } });

        if (products.length > 0) {
            const formattedProducts = products.map(product => ({
                id: product.product_id,
                name: product.name,
                price: product.price,
                image: product.primary_image,
                imageHover: product.image_hover,
                color: product.array_color.map(arrayColor => ({
                    name_color: arrayColor.name_color,
                    code_color: arrayColor.code_color,
                    image: arrayColor.image,
                })),
            }));

            return res.status(200).json({ success: true, products: formattedProducts });
        } else {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm nào", color: "text-red-500" });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

module.exports = {
    getProductListALL,
    getProductDetail,
    admin_to_get_product_list,
    update_onlShop_product,
    add_product,
    delete_product,
    update_product,
    searchProductsByName
};
