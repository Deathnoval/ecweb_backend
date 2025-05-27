const { type } = require("express/lib/response");
const { boolean, bool, number, required } = require("joi");
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  Order_id: { type: String, 
    required: true,
    trim: true 
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  email: { type: String,
      required: true,
      trim: true 
    },

  items: [
    {
      product_id: {
        type: String,
        required: true,
        trim: true
      },
      product_name: {
        type: String,
        required: true,
        trim: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      color: {
        type: String,
        trim: true
      },
      size: {
        type: String,
        trim: true
      },
      image_hover: {
        type: String,
        required: true,
        trim: true
      },
      code: { type: String, 
        required: true,
        trim: true 
      },
      selected_buy: {
        type: Boolean,
        required: true,
        default: true,
      },
      price_per_one: { type: Number, required: true, default: 0 },
      price_per_item: { type: Number, required: true },
    },
  ],
  total_price: {
    type: Number,
    required: true,
    default: 0,
  },
  shipping_code: { type: Number, required: true, default: 0 },
  price_pay: { type: Number, required: true, default: 0 },
  address: {
    street: { type: String, 
      require: true,
      trim: true
     },
    provinceID: { type: String, 
      require: true,
      trim: true
     },
    provinceName: { type: String, 
      require: true,
      trim: true
    },
    districtID: { type: String, 
      require: true,
      trim: true
     },
    districtName: { type: String, 
      require: true,
      trim: true},
    wardCode: { type: String, require: true,
      trim: true },
    wardName: { type: String, require: true,
      trim: true 
    },
  },
  phone: { type: String, required: true,
    trim: true 
  },
  name: { type: String, required: true,
    trim: true 
  },
  type_pay: { type: Number, required: true },
  status: { type: Number, required: true, default: 1 },
  order_date: { type: Date, required: true },
  paymentUrl: { type: String, required: false, default: "" ,
    trim: true }, // URL thanh toán nếu có
  refund_request: {
    list_image: [
      {
        uid: String,
        url: { type: String, required: true ,
          trim: true }

      }
    ], // URL ảnh minh chứng
    description: { type: String, required: false,
    trim: true },   // Lý do yêu cầu hoàn tiền
    refund_date: { type: Date, required: false },
  },
});

const Order = mongoose.model("Order", OrderSchema, "Order");

module.exports = Order;
