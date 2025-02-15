const { type } = require("express/lib/response");
const { boolean, bool, number, required } = require("joi");
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  Order_id: { type: String, required: true },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  email: { type: String, required: true },

  items: [
    {
      product_id: {
        type: String,
        required: true,
      },
      product_name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      color: {
        type: String,
      },
      size: {
        type: String,
      },
      image_hover: {
        type: String,
        required: true,
      },
      code: { type: String, required: true },
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
    street: { type: String, require: true },
    provinceID: { type: String, require: true },
    provinceName: { type: String, require: true },
    districtID: { type: String, require: true },
    districtName: { type: String, require: true },
    wardCode: { type: String, require: true },
    wardName: { type: String, require: true },
  },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  type_pay: { type: Number, required: true },
  status: { type: Number, required: true, default: 1 },
  order_date: { type: Date, required: true },
  paymentUrl: { type: String, required: false, default: "" },
  refund_request: {
    list_image: [
      {
        uid: String,
        url: { type: String, required: true }

      }
    ], // URL ảnh minh chứng
    description: { type: String, required: false },   // Lý do yêu cầu hoàn tiền
    refund_date: { type: Date, required: false },
  },
});

const Order = mongoose.model("Order", OrderSchema, "Order");

module.exports = Order;
