const req = require('express/lib/request');
const Product = require('../models/product');

const getProductListALL = async (req, res) => {
    const type_get = req.params.type_get
    const value_sort = req.params.value_sort

    try {
        productListAll = await Product.find();
        if (type_get != "all") {

            productListAll = await Product.find({
                category_id: type_get,


            })
            console.log(productListAll);
            if (!(productListAll.length > 0)) {
                console.log('Product');
                productListAll = await Product.find({

                    sub_category_id: type_get,
                })
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
}
module.exports = {
    getProductListALL,
}