const req = require('express/lib/request');
const Product = require('../models/product');
const Category = require('../models/category');
const { string } = require('joi');

const getProductListALL = async (req, res) => {
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
        productListAll = await Product.find({ total_number: { $gt: 0 } }).sort(sortOptions);
        if (type_get != "all") {

            productListAll = await Product.find({
                category_id: type_get,
                total_number: {
                    $gt: 0
                }



            }).sort(sortOptions);
            console.log(productListAll);
            if (!(productListAll.length > 0)) {
                console.log('Product');
                productListAll = await Product.find({
                    sub_category_id: type_get,
                    total_number: { $gt: 0 }
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
    try {
        const product = await Product.findOne({ product_id: id })
        console.log(typeof (product))
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
async function getNameSubCategor(id,subId){
    
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
        
        let name=formattedSubCategories.find(subCategory => subCategory.key === subId)
        console.log(typeof(name.label))
        return name.label
      }
    }
    catch(err)
    {
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
            total_number:product.total_number,
            primary_image: product.primary_image,
            category_id:product.category_id,
            sub_category_id:product.sub_category_id,
            name_sub_category: await getNameSubCategor(product.category_id,product.sub_category_id),
            product_id:product.product_id,
            status: product.total_number > 0 ? 'Còn hàng' : 'Hết hàng',
            onlShop:product.onlShop,
            createDate:product.createDate
            
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





module.exports = {
    getProductListALL,
    getProductDetail,
    getProductListALL_with_Sattus
}