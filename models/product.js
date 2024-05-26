const { boolean, bool } = require('joi');
const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: String,
    price: Number,
    total_number: Number,
    array_color: [
        {
            name_color: String,
            code_color: String,
            total_number_with_color: Number,
            image: String,
            array_sizes: [
                {
                    name_sizes: String,
                    total_number_with_sizes: Number,
                }
            ]
        }
    ],
    array_image: [

    ],
    primary_image: String,
    image_hover: String,
    category_id: String,
    sub_category_id: String,
    product_id: {
        type: String,
        unique: true,
    },
    description: String,
    onlShop: { type: Boolean, default: false, },
    createDate: { type: Date, default: Date.now, }


});
const Product = mongoose.model('products', productSchema, 'products');

module.exports = Product;