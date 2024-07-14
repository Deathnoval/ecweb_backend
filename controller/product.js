const date = require('date-and-time')
const req = require('express/lib/request');
const Product = require('../models/product');
const Category = require('../models/category');
const { string } = require('joi');
const { json } = require('body-parser');



function generateProductId() {
    const chars = '1234567890';
    let id = '';
    for (let i = 0; i < 3; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

const getProductListALL = async (req, res) => {
    const type_get = req.params.type_get
    const value_sort = req.params.value_sort
    console.log(value_sort)
    let sortField
    let sortOrder
    if (!value_sort) {
        sortField = "createdAt"
        sortOrder = "desc"
    }
    else {
        if (value_sort == "1") {
            sortField = "price"
            sortOrder = "asc"
        }
        else if (value_sort == "2") {
            sortField = "price"
            sortOrder = "desc"
        }
        else if (value_sort == "3") {
            sortField = "name"
            sortOrder = "asc"
        }
        else if (value_sort == "4") {
            sortField = "name"
            sortOrder = "desc"
        }
    }





    let sortOptions = {};
    sortOptions[sortField] = sortOrder;
    console.log(sortOptions);
    try {
        let productListAll = await Product.find({ total_number: { $gt: 0 }, onlShop: true }).sort(sortOptions);
        console.log(productListAll);
        if (type_get != "all") {

            productListAll = await Product.find({
                category_id: type_get,
                total_number: {
                    $gt: 0
                },
                onlShop: true,



            }).sort(sortOptions);
            console.log(productListAll);
            if (!(productListAll.length > 0)) {
                console.log('Product');
                productListAll = await Product.find({
                    sub_category_id: type_get,
                    total_number: { $gt: 0 },
                    onlShop: true,
                }).sort(sortOptions);
            }
            console.log(productListAll)

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
        if (productListAll_DataFormat) {
            res.json({ success: true, productListAll_DataFormat });
        }
        else {
            res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
        }



    }
    catch (err) {
        console.error(err);
        res.json({ success: false, message: err, color: 'text-red-500' })
    }
};

const getProductDetail = async (req, res) => {
    const { id } = req.params
    // const token = req.headers.token;
    try {
        let product = await Product.findOne({ product_id: id })

        // console.log(typeof (product))
        if (product) {
            res.json({ success: true, product })
        }
        else {
            res.json({ success: false, message: 'không tìm thấy sản phẩm', color: 'text-red-500' });
        }
    }
    catch (err) {
        console.log(err);
        res.json({ success: false, message: err });
    }


};

const admin_to_get_product_list = async (req, res) => {
    try {
        const id = req.params.id;
        const sortField = "createDate"
        const sortOrder = 1
        let sortOptions = {};
        sortOptions[`${sortField}`] = sortOrder;
        console.log(sortOptions);
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
            createDate: date.format(product.createDate, "DD/MM/YYYY HH:mm:ss"),

        }));

        return res.json({ success: true, formatted_product });

    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

async function getNameSubCategor(id, subId) {

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

            let name = formattedSubCategories.find(subCategory => subCategory.key === subId)
            console.log(typeof (name.label))
            return name.label
        }
    }
    catch (err) {
        console.log(err);

    }
}
const getProductListALL_with_Sattus = async (req, res) => {
    const type_get = req.params.type_get
    const value_sort = req.params.value_sort
    console.log(value_sort)
    let sortField = "createdAt"
    let sortOrder = "desc"

    if (value_sort == "1") {
        sortField = "price"
        sortOrder = "asc"
    }
    else if (value_sort == "2") {
        sortField = "price"
        sortOrder = "desc"
    }
    else if (value_sort == "3") {
        sortField = "name"
        sortOrder = "asc"
    }
    else if (value_sort == "4") {
        sortField = "name"
        sortOrder = "desc"
    }



    const sortOptions = {};
    sortOptions[sortField] = sortOrder;
    console.log(sortOptions);
    try {
        productListAll = await Product.find().sort(sortOptions);
        if (type_get != "all") {

            productListAll = await Product.find({
                category_id: type_get




            }).sort(sortOptions);
            console.log(productListAll);
            if (!(productListAll.length > 0)) {
                console.log('Product');
                productListAll = await Product.find({
                    sub_category_id: type_get

                }).sort(sortOptions);
            }
            console.log(productListAll)

        }

        const productListAll_DataFormat = await Promise.all(productListAll.map(async product => ({

            name: product.name,
            price: product.price,
            total_number: product.total_number,
            primary_image: product.primary_image,
            category_id: product.category_id,
            sub_category_id: product.sub_category_id,
            name_sub_category: await getNameSubCategor(product.category_id, product.sub_category_id),
            product_id: product.product_id,
            status: product.total_number > 0 ? 'Còn hàng' : 'Hết hàng',
            onlShop: product.onlShop,
            createDate: date.format(product.createDate, "DD/MM/YYYY HH:mm:ss")

        })));
        if (productListAll_DataFormat) {
            res.json({ success: true, productListAll_DataFormat });
        }
        else {
            res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
        }



    }
    catch (err) {
        console.error(err);
        res.json({ success: false, message: err, color: 'text-red-500' })
    }
};
const update_onlShop_product = async (req, res) => {
    const id = req.body.id
    const onlShop = req.body.onlShop
    try {
        const check_category_undefined = Product.findOne({ product_id: id })
        if (check_category_undefined.category_id == "undefined" || check_category_undefined.sub_category_id == "undefined") {
            return res.json({ success: false, message: "Sản phẩm phải có danh mục chính rõ ràng", color: "text-red-500" })
        }
        else {
            const updatedProduct = await Product.findOneAndUpdate(
                { product_id: id }, // Find the product by product_id
                { onlShop: onlShop }, // Update the onlShop property
                { new: true } // Return the updated document
            );

            if (!updatedProduct) {
                return res.json({ success: false, message: "Không tìm thấy sản phẩm", color: "text-red-500" });
            }

            return res.json({ success: true, message: 'Cập nhật trạng thái thành công ', color: 'text-green-500' });
        }

    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
}
const add_product = async (req, res) => {
    try {
        let { name, total, price, array_color, array_image, imagePrimaryAndHover, category_id, sub_category_id, description, codeProduct } = req.body;
        console.log({ name, price, array_color, array_image, imagePrimaryAndHover, category_id, sub_category_id, codeProduct })
        if (!name) {
            return res.json({ success: false, message: "Tên sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!price) {
            return res.json({ success: false, message: "Giá sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!total) {
            return res.json({ success: false, message: "Số lượng  sản phẩm không được để trống", color: "text-red-500" });
        }

        if (!array_image) {
            return res.json({ success: false, message: "Danh sách ảnh sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!imagePrimaryAndHover) {
            return res.json({ success: false, message: "vui lòng chọn ảnh chính và ảnh review", color: "text-red-500" });
        }
        if (!category_id) {
            return res.json({ success: false, message: "Danh mục chính sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!sub_category_id) {
            return res.json({ success: false, message: "Danh mục phụ sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!description) {
            return res.json({ success: false, message: "Mô tả sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!codeProduct) {
            return res.json({ success: false, message: "Mã sản phẩm không được để trống", color: "text-red-500" });
        }


        else {
            const checkProduct_code = await Product.findOne({ code: codeProduct });
            console.log(checkProduct_code);
            const checkProduct_category = await Category.findOne({ category_id: category_id });

            if (checkProduct_code != null) {
                return res.json({ success: false, message: "Mã sãn phẫm đã tồn tại", color: "text-red-500" })
            }
            if (!checkProduct_category) {
                return res.json({ success: false, message: "Mã danh mục chính sai", color: "text-red-500" })
            }
            else {
                const checkProduct_sub_category = checkProduct_category.sub_category.findIndex(sub => sub.sub_category_id === sub_category_id);
                if (checkProduct_sub_category === -1) {
                    return res.json({ success: false, message: "Mã danh mục phụ sai", color: "text-red-500" })
                }
            }
            let total_number
            let hasError = false
            if (array_color.length > 0) {
                total_number = 0;
                array_color.forEach(color => {
                    let total_number_with_color = 0;
                    // if (color.array_sizes.length <= 0) {
                    //     hashError = true;
                    // }else
                    // {}
                    color.array_sizes.forEach(size => {
                        total_number_with_color += parseInt(size.total_number_with_size);

                    });
                    if (color.total_number_with_color != total_number_with_color && color.array_sizes.length > 0) {
                        hashError = false;
                    } else {
                        hasError = true
                        total_number += parseInt(color.total_number_with_color)
                        console.log(color.array_sizes)

                    }
                });
                if (!hasError)
                    return res.json({ success: false, message: "Tổng các size sản phẩm không bằng tổng số lượng màu sản phẩm ", color: "text-red-500" });

                if (parseInt(total_number) != total) {
                    return res.json({ success: false, message: "Tổng các màu sản phẩm không bằng tổng số lượng sản phẩm ", color: "text-red-500" });
                };
            }
            let new_product_id;
            do {
                new_product_id = generateProductId();
                console.log(new_product_id);
            } while (await Product.findOne({ Product: new_product_id }));

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
                onlShop: false,
                product_id: new_product_id,
                createdAt: Date.now(),
                code: codeProduct
            });

            // Save the product to the database
            let check_add_success = true
            await newProduct.save().catch(err => {
                console.log(err);
                check_add_success = false;
            });
            if (check_add_success) {
                return res.json({ success: true, message: "Thêm sản phẩm mới thành công", color: "text-green-500" });
            }
            else {
                return res.json({ success: false, message: "Thêm sản phẩm thất bại", color: "text-red-500" });
            }
        }
    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const delete_product = async (req, res) => {
    try {
        const product_id = req.body.product_id;
        if (!product_id) {
            return res.json({ success: false, message: "Không nhận được id của sản phẩm", color: "text-red-500" });
        }
        else {
            const product = await Product.findOne({ product_id: product_id });
            if (!product) {
                return res.json({ success: false, message: "Không tìm thấy sản phẩm", color: "text-red-500" });
            }
            else {
                const check_delete_success = await Product.deleteOne({ product_id: product_id });
                if (check_delete_success) {
                    return res.json({ success: true, message: "Xoá sản phẩm thành công", color: "text-green-500" });
                }
                else {
                    return res.json({ success: false, message: "Xoá sản phẩm thất bại", color: "text-red-500" });
                }
            }
        }
    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const update_product = async (req, res) => {
    try {
        let { product_id, name, total, price, array_color, array_image, imagePrimaryAndHover, category_id, sub_category_id, description, codeProduct } = req.body;
        console.log({ name, price, array_color, array_image, imagePrimaryAndHover, category_id, sub_category_id, codeProduct })
        if (!name) {
            return res.json({ success: false, message: "Tên sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!price) {
            return res.json({ success: false, message: "Giá sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!total) {
            return res.json({ success: false, message: "Số lượng  sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!array_image) {
            return res.json({ success: false, message: "Danh sác ảnh sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!imagePrimaryAndHover) {
            return res.json({ success: false, message: "vui lòng chọn ảnh chính và ảnh review", color: "text-red-500" });
        }
        if (!category_id) {
            return res.json({ success: false, message: "Danh mục chính sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!sub_category_id) {
            return res.json({ success: false, message: "Danh mục phụ sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!description) {
            return res.json({ success: false, message: "Mô tả sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!codeProduct) {
            return res.json({ success: false, message: "Mã sản phẩm không được để trống", color: "text-red-500" });
        }
        if (!product_id)
            return res.json({ success: false, message: "ID sản phẩm không được để trống", color: "text-red-500" });


        else {
            const check_product_id = await Product.findOne({ product_id: product_id });
            if (check_product_id) {
                // const checkProduct_code = await Product.findOne({ code: codeProduct });
                // console.log(checkProduct_code);
                const checkProduct_category = await Category.findOne({ category_id: category_id });

                if (check_product_id.code != codeProduct) {
                    const checkProduct_code = await Product.findOne({ code: codeProduct });
                    if (checkProduct_code != null)
                        return res.json({ success: false, message: "Mã sãn phẫm đã tồn tại", color: "text-red-500" })
                }
                if (!checkProduct_category) {
                    return res.json({ success: false, message: "Mã danh mục chính sai", color: "text-red-500" })
                }
                else {
                    const checkProduct_sub_category = checkProduct_category.sub_category.findIndex(sub => sub.sub_category_id === sub_category_id);
                    if (checkProduct_sub_category === -1) {
                        return res.json({ success: false, message: "Mã danh mục phụ sai", color: "text-red-500" })
                    }
                }
                let total_number
                let hasError = false
                if (array_color.length > 0) {
                    total_number = 0;
                    array_color.forEach(color => {
                        let total_number_with_color = 0;
                        color.array_sizes.forEach(size => {
                            total_number_with_color += parseInt(size.total_number_with_size);

                        });
                        if (color.total_number_with_color != total_number_with_color) {

                        } else {
                            total_number += parseInt(color.total_number_with_color)
                            hasError = true
                            console.log(color.array_sizes)

                        }
                    });
                    if (hasError == false)
                        return res.json({ success: false, message: "Tổng các size sản phẩm không bằng tổng số lượng màu sản phẩm ", color: "text-red-500" });

                    if (parseInt(total_number) != total) {
                        return res.json({ success: false, message: "Tổng các màu sản phẩm không bằng tổng số lượng sản phẩm ", color: "text-red-500" });
                    };
                }

                const update_product = await Product.findOneAndUpdate({ product_id: product_id }, {
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
                    onlShop: false,

                    createdAt: Date.now(),
                    code: codeProduct
                }, { new: true })

                // const newProduct = new Product({
                //     name,
                //     price,
                //     total_number: total,
                //     array_color,
                //     array_image,
                //     primary_image: imagePrimaryAndHover.primary_image,
                //     image_hover: imagePrimaryAndHover.image_hover,
                //     category_id,
                //     sub_category_id,
                //     description,
                //     onlShop: false,
                //     product_id: new_product_id,
                //     createdAt: Date.now(),
                //     code: codeProduct
                // });

                // Save the product to the database

                if (update_product) {
                    return res.json({ success: true, message: "Cập nhật sản phẩm thành công", color: "text-green-500" });
                }
                else {
                    return res.json({ success: false, message: "Cập nhật sản phẩm thất bại", color: "text-red-500" });
                }
            }
            else {
                return res.json({ success: false, message: "id sản phẩm không tồn tại ", color: "text-red-500" });
            }

        }
    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
}


module.exports = {
    getProductListALL,
    getProductDetail,
    getProductListALL_with_Sattus,
    update_onlShop_product,
    add_product,
    delete_product,
    admin_to_get_product_list,
    update_product
}