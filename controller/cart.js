const Product = require("../models/product");
const Category = require("../models/category");
const Cart = require("../models/cart");

const add_to_cart = async (req, res) => {
  const user_id = req.user.id;
  const {
    product_id,
    product_name,
    quantity,
    color,
    size,
    image_hover,
    code,
    price_per_one,
  } = req.body;
  if (!product_id) {
    return res.json({
      success: false,
      message: "Id sản phẩm không được để trống",
      color: "text-red-500",
    });
  }
  if (!product_name) {
    return res.json({
      success: false,
      message: "Tên sản phẩm không được để trống",
      color: "text-red-500",
    });
  }
  if (!code) {
    return res.json({
      success: false,
      message: "Mã sản phẩm không được để trống",
      color: "text-red-500",
    });
  }
  if (!image_hover) {
    return res.json({
      success: false,
      message: "Ảnh hover sản phẩm không được để trống",
      color: "text-red-500",
    });
  }
  try {
    const product = await Product.findOne({ product_id: product_id });
    if (!product) {
      return res.json({
        success: false,
        message: "Không tìm thấy sản phẩm",
        color: "text-red-500",
      });
    }
    if (color && size) {
      const selectedColor = product.array_color.find(
        (colorObj) => colorObj.name_color === color
      );


      // Find the matching size object within the selected color's array_sizes
      const selectedSize = selectedColor.array_sizes.find(
        (sizeObj) => sizeObj.name_size === size
      );
      if (!selectedSize) {
        return res.json({ success: false, message: "Màu " + color + " không có size " + size, color: "text-red-500" });
      }


      // Check stock availability for the chosen color and size
      if (selectedSize.total_number_with_size < quantity) {
        return res.json({ success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" })

      }
    }
    else {
      if (color) {
        const selectedColor = product.array_color.find(
          (colorObj) => colorObj.name_color === color
        );
        if (selectedColor.total_number_with_color < quantity) {
          return res.json({ success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" })
        }
      }
      else {
        if (product.total_number < quantity) {
          return res.json({ success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" })

        }
      }
    }
    const cart = await Cart.findOne({ user_id: user_id });
    if (!cart) {
      const newCart = new Cart({ user_id: user_id });
      newCart.items.push({
        product_id: product_id,
        product_name: product_name,
        quantity: quantity,
        color: color,
        size: size,
        image_hover: image_hover,
        code: code,
        price_per_one: price_per_one,
      });

      // await newCart.save();
      newCart.total_price = newCart.items.reduce(
        (total, item) => total + item.price_per_one * item.quantity,
        0
      );
      await newCart.save();
      return res.json({
        success: true,
        message: "Thêm vào giỏ hàng thành công",
        color: "text-green-500",
      });
    }
    const existingItem = cart.items.find(
      (item) =>
        item.product_id === product_id &&
        item.color === color &&
        item.size === size &&
        item.code === code
    );
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product_id: product_id,
        product_name: product_name,
        quantity: quantity,
        color: color,
        size: size,
        image_hover: image_hover,
        code: code,
        price_per_one: price_per_one,
      });
    }
    cart.total_price = cart.items.reduce(
      (total, item) => total + item.price_per_one * item.quantity,
      0
    );
    await cart.save();
    return res.json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      color: "text-green-500",
    });
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const cart_show = async (req, res) => {
  const user_id = req.user.id;
  try {
    const cart = await Cart.findOne({ user_id: user_id });
    res.json({ success: true, items: cart.items, total_price: cart.total_price });
  } catch (err) {
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const show_number_items_in_cart = async (req, res) => {
  const user_id = req.user.id;
  try {
    const cart = await Cart.findOne({ user_id: user_id });
    let number_items = 0;
    cart.items.forEach((item) => {
      number_items += item.quantity;
    });
    res.json(number_items);
  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const delete_items_in_cart = async (req, res) => {
  const user_id = req.user.id;
  const product_id = req.params.product_id
  try {
    if (!product_id) {
      return res.json({ success: false, message: "Mã sản phẩm không được để trống", color: "text-red-500" })
    }
    const product_cart = await Product.find({ product_id: product_id, user_id: user_id })
    if (!product_cart) {
      return res.json({ success: false, message: "không tìm thấy sản phẩm này trong giỏ hàng của bạn", color: "text-red-500" })
    }

  } catch {

  }
};

const update_items_in_cart = async (req, res) => { };

module.exports = {
  add_to_cart,
  cart_show,
  show_number_items_in_cart,
  delete_items_in_cart,
  update_items_in_cart,
};
