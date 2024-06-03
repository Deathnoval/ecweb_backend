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
            image: {
                uid: String,
                url: String,
            },
            _id: String,
            array_sizes: [
                {
                    name_size: String,
                    total_number_with_size: Number,
                    _id: String,
                }
            ]
        }
    ],
    array_image: [
        {
            uid: String,
            url: String,
        }
    ],
    primary_image: {
        uid: String,
        url: String,
    },
    image_hover: {
        uid: String,
        url: String,
    },
    category_id: String,
    sub_category_id: String,
    product_id: {
        type: String,
        unique: true,
    },
    description: String,
    onlShop: { type: Boolean, default: false, },
    createDate: { type: Date, default: Date.now, },
    code: { type: String, require: true }


});

const Product = mongoose.model('products', productSchema, 'products');

module.exports = Product;