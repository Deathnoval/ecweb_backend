const { boolean, bool } = require('joi');
const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: String,
    price: Number,
    total_number: Number,
    quantityBought :{type:Number, default:0},
    array_color: [
        {
            name_color: String,
            code_color: String,
            total_number_with_color: Number,
            image: {
                uid: String,
                url: { type: String, required: true,
                    trim: true
                }


            },
            _id: String,
            array_sizes: [
                {
                    name_size: {type: String,trim: true},
                    total_number_with_size: Number,
                    _id: String,
                }
            ]
        }
    ],
    array_image: [
        {
            uid: String,
            url: { type: String, required: true,
                trim: true
            },

        }
    ],
    primary_image: {
        uid: String,
        url: { type: String, required: true,trim: true }


    },
    image_hover: {
        uid: String,
        url: { type: String, required: true,trim: true }

    },
    category_id: {type: String,trim: true},
    sub_category_id: {type: String,trim: true},
    product_id: {
        type: String,
        unique: true,
        trim: true
    },
    description: {type: String,trim: true},
    onlShop: { type: Boolean, default: false, },
    createDate: { type: Date, default: Date.now, },
    code: { type: String, require: true, trim: true }


});

const Product = mongoose.model('products', productSchema, 'products');

module.exports = Product;