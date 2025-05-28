const Product = require("../models/product");
const Category = require("../models/category");
const Cart = require("../models/cart");
const { User, validate } = require("../models/user");




const check_quantity = async (product_id, color, quantity, size) => {
  const product = await Product.findOne({ product_id: product_id });
  if (!product) {
    return {
      success: false,
      message: "Không tìm thấy sản phẩm",
      color: "text-red-500",
    };
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
      return { success: false, message: "Màu " + color + " không có size " + size, color: "text-red-500" };
    }


    // Check stock availability for the chosen color and size
    if (selectedSize.total_number_with_size < quantity) {
      return { success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" }

    }
  }
  if (!color || !size) {
    const check_color_product = product.array_color.length
    if (check_color_product > 0 && !color) {
      return { success: false, message: "Vui lòng chọn màu cho sản phẩm", color: "text-red-500" }
    }
    if (color) {
      const selectedColor = product.array_color.find(
        (colorObj) => colorObj.name_color === color
      );
      if (selectedColor.array_sizes.length > 0) {
        if (!size) {
          return { success: false, message: "Vui lòng chọn size sẩn phẩm", color: "text-red-500" }
        }
      }

      if (selectedColor.total_number_with_color < quantity) {
        return { success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" }
      }
    }
    else {
      if (product.total_number < quantity) {
        return { success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" }

      }
    }
  }
  return {}
}


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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
        color: "text-red-500",
      });
    }
    if (color && size) {
      const selectedColor = product.array_color.find(
        (colorObj) => colorObj.name_color === color
      );
      if (!selectedColor) {
        return res.status(404).json({ success: false, message: " Không có màu: " + color, color: "text-red-500" });
      }

      // Find the matching size object within the selected color's array_sizes
      const selectedSize = selectedColor.array_sizes.find(
        (sizeObj) => sizeObj.name_size === size
      );
      if (!selectedSize) {
        return res.status(404).json({ success: false, message: "Màu " + color + " không có size " + size, color: "text-red-500" });
      }


      // Check stock availability for the chosen color and size
      if (selectedSize.total_number_with_size < quantity) {
        return res.status(500).json({ success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" })

      }
    }
    if (!color || !size) {
      const check_color_product = product.array_color.length
      if (check_color_product > 0 && !color) {
        return res.status(404).json({ success: false, message: "Vui lòng chọn màu cho sản phẩm", color: "text-red-500" })
      }
      if (color) {
        const selectedColor = product.array_color.find(
          (colorObj) => colorObj.name_color === color
        );
        if (selectedColor.array_sizes.length > 0) {
          if (!size) {
            return res.status(404).json({ success: false, message: "Vui lòng chọn size sẩn phẩm", color: "text-red-500" })
          }
        }

        if (selectedColor.total_number_with_color < quantity) {
          return res.status(500).json({ success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" })
        }
      }
      else {
        if (product.total_number < quantity) {
          return res.status(500).json({ success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" })

        }
      }
    }
    const cart = await Cart.findOne({ user_id: user_id });
    if (!cart) {
      const newCart = new Cart({ user_id: user_id });
      const price_per_item = price_per_one * quantity
      console.log(price_per_item);
      newCart.items.push({
        product_id: product_id,
        product_name: product_name,
        quantity: quantity,
        color: color,
        size: size,
        image_hover: image_hover,
        code: code,
        price_per_one: price_per_one,
        price_per_item: price_per_one * quantity

      });

      // await newCart.save();
      newCart.total_price = newCart.items.reduce(
        (total, item) => total + item.price_per_one * item.quantity,
        0
      );
      await newCart.save();
      return res.status(200).json({
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
        price_per_item: price_per_one * quantity
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
    if (!cart) {
      return res.status(200).json({ success: true, items: [], total_price: 0 });
    }

    const updatedItems = [];
    const invalidItems = [];

    for (let item of cart.items) {
      const product = await Product.findOne({ product_id: item.product_id });
      if (!product) {
        invalidItems.push({
          ...item._doc,
          reason: "Sản phẩm không còn tồn tại"
        });
        continue;
      }

      let maxAvailable = product.total_number;
      let reason = "";

      if (item.color && item.size) {
        const colorObj = product.array_color.find(c => c.name_color === item.color);
        if (colorObj) {
          const sizeObj = colorObj.array_sizes.find(s => s.name_size === item.size);
          if (sizeObj) {
            maxAvailable = sizeObj.total_number_with_size;
          } else {
            reason = `Màu "${item.color}" không có size "${item.size}"`;
            maxAvailable = 0;
          }
        } else {
          reason = `Không tìm thấy màu "${item.color}"`;
          maxAvailable = 0;
        }
      } else if (item.color) {
        const colorObj = product.array_color.find(c => c.name_color === item.color);
        if (colorObj) {
          maxAvailable = colorObj.total_number_with_color;
        } else {
          reason = `Không tìm thấy màu "${item.color}"`;
          maxAvailable = 0;
        }
      }

      if (maxAvailable <= 0) {
        invalidItems.push({
          ...item._doc,
          reason: reason || "Sản phẩm đã hết hàng"
        });
        continue;
      }

      if (item.quantity > maxAvailable) {
        // Cập nhật số lượng trong cart
        item.quantity = maxAvailable;
        item.price_per_item = item.price_per_one * maxAvailable;

        invalidItems.push({
          ...item._doc,
          reason: `Số lượng trong giỏ đã được điều chỉnh còn ${maxAvailable} vì tồn kho không đủ`
        });
      }

      updatedItems.push(item);
    }

    // Cập nhật lại cart
    cart.items = updatedItems;
    cart.total_price = updatedItems.reduce(
      (total, item) => total + item.price_per_one * item.quantity,
      0
    );
    await cart.save();

    return res.status(200).json({
      success: true,
      items: updatedItems,
      total_price: cart.total_price,
      warnings: invalidItems.length > 0 ? invalidItems : null
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



const show_number_items_in_cart = async (req, res) => {
  const user_id = req.user.id;
  try {
    const cart = await Cart.findOne({ user_id: user_id });

    let number_items = 0;
    if (cart) {
      cart.items.forEach((item) => {
        number_items += item.quantity;
      });
    }
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
  const id = req.body._id.toString()
  // console.log(id)
  try {
    if (!id) {
      return res.status(400).json({ success: false, message: "Mã sản phẩm trong giỏ hàng không được để trống", color: "text-red-500" })
    }
    const product_cart = await Cart.findOne({ user_id: user_id })
    // console.log(product_cart)
    const productIndex = product_cart.items.findIndex(item => item._id.toString() == id);
    // console.log(productIndex)
    if (productIndex === -1) {
      return res.status(500).json({ success: false, message: "Sản phẩm này đã được bỏ khỏi giỏ hàng của bạn", color: "text-green-500" })
    }
    product_cart.items.splice(productIndex, 1);

    // console.log(product_cart)
    product_cart.total_price = product_cart.items.reduce(
      (total, item) => total + item.price_per_one * item.quantity,
      0
    );
    await product_cart.save();
    return res.status(200).json({ success: true, message: "Bỏ sản phẩm khỏi giỏ hàng thành công", color: "text-green-500" });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
  }
};

const update_items_in_cart = async (req, res) => {
  const user_id = req.user.id;
  const id = req.body._id;
  const quantity = req.body.quantity
  try {
    if (!id) {
      return res.status(400).json({ success: false, message: "Mã sản phẩm trong giỏ hàng không được để trống" });
    }
    const product_cart = await Cart.findOne({ user_id: user_id })
    const productIndex = product_cart.items.findIndex(item => item._id.toString() == id);
    if (productIndex === -1) {
      return res.status(500).json({ success: false, message: "Sản phẩm này đã được bỏ khỏi giỏ hàng của bạn", color: "text-green-500" })
    }
    if (quantity == 0) {
      product_cart.items.splice(productIndex, 1);
    }
    else {

      const flag_check_quantity = await check_quantity(product_cart.items[productIndex].product_id, product_cart.items[productIndex].color, quantity, product_cart.items[productIndex].size)
      console.log(flag_check_quantity)
      if (flag_check_quantity.success == false) { return res.status(500).json(flag_check_quantity) }
      product_cart.items[productIndex].quantity = quantity;
      product_cart.items[productIndex].price_per_item = product_cart.items[productIndex].price_per_one * quantity;
    }
    product_cart.total_price = product_cart.items.reduce(
      (total, item) => total + item.price_per_one * item.quantity,
      0
    );
    await product_cart.save();
    console.log(product_cart)
    return res.status(200).json({ success: true, message: "Cập nhật giỏ hàng thành công", color: "text-green-500" });

  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
  }
};

function generateOrderId() {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyz';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const check_out = async (req, res) => {
  const order_id = generateOrderId()
  const list_id = req.body.items;
  // console.log(list_id)
  const user_id = req.user.id;
  try {
    if (list_id.length <= 0) {
      return res.status(404).json({ success: false, message: "Chưa chọn sản phẩm để thanh toán", color: "text-red-500" })
    }
    const user_cart = await Cart.findOne({ user_id: user_id });
    // console.log(user_cart)
    let items_user_choice = [];
    let total_price_user_choice = 0
    for (let item_id of list_id) {
      const productIndex = user_cart.items.findIndex(item => item._id.toString() == item_id._id.toString());
      if (productIndex === -1) {
        return res.status(404).json({ success: false, message: "Sản phẩm này đã được bỏ khỏi giỏ hàng của bạn", color: "text-green-500" })
      }
      let item = user_cart.items[productIndex];
      total_price_user_choice += user_cart.items[productIndex].price_per_item;
      let flag_check_quantity = await check_quantity(user_cart.items[productIndex].product_id, user_cart.items[productIndex].color, user_cart.items[productIndex].quantity, user_cart.items[productIndex].size)
      // console.log(flag_check_quantity)
      if (flag_check_quantity.success == false) { return res.status(500).json(flag_check_quantity) }
      else {
        items_user_choice.push(item);
      }// console.log(item)
    }
    if (items_user_choice.length <= 0)
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại trong giỏ hàng của của bạn", color: "text-red-500" })


    return res.status(200).json({ success: true, order: { order_id: order_id, items: items_user_choice, total_price: total_price_user_choice }, color: "text-green-500" })
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
  }
}

module.exports = {
  add_to_cart,
  cart_show,
  show_number_items_in_cart,
  delete_items_in_cart,
  update_items_in_cart,
  check_out,

};
