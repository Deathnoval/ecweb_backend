const Cart = require('../models/cart');
const Product = require('../models/product');
const { User, validate } = require('../models/user');
const Order = require('../models/Order');
const { type } = require('express/lib/response');


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
};

const sub_quantity = async (product_id, color, quantity, size) => {
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
        const selectedColorIndex = product.array_color.findIndex((colorObj) => colorObj.name_color === color);


        // Find the matching size object within the selected color's array_sizes
        const selectedSize = selectedColor.array_sizes.find(
            (sizeObj) => sizeObj.name_size === size
        );

        // console.log(selectedSize)
        if (!selectedSize) {
            return { success: false, message: "Màu " + color + " không có size " + size, color: "text-red-500" };
        }

        const selectedSizeIndex = product.array_color[selectedColorIndex].array_sizes.findIndex((sizeObj) => sizeObj.name_size === size);




        // Check stock availability for the chosen color and size
        if (selectedSize.total_number_with_size < quantity) {
            return { success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" }

        } else {
            product.array_color[selectedColorIndex].array_sizes[selectedSizeIndex].total_number_with_size -= quantity
            product.array_color[selectedColorIndex].total_number_with_color -= quantity
            product.total_number -= quantity
            await product.save()
            return {}
            // console.log(product)
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
            const selectedColorIndex = product.array_color.findIndex((colorObj) => colorObj.name_color === color);

            if (selectedColor.total_number_with_color < quantity) {
                return { success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" }
            }

            else {
                // product.array_color[selectedColorIndex].array_sizes[selectedSizeIndex].total_number_with_size -= quantity
                product.array_color[selectedColorIndex].total_number_with_color -= quantity
                product.total_number -= quantity
                await product.save()
                return {}
                // console.log(product)
            }
            // console.log(selectedSize)

        }
        else {
            if (product.total_number < quantity) {
                return { success: false, message: "Số lượng sản phẩm còn lại không đủ", color: "text-red-500" }

            } else {
                // product.array_color[selectedColorIndex].array_sizes[selectedSizeIndex].total_number_with_size -= quantity
                // product.array_color[selectedColorIndex].total_number_with_color -= quantity
                product.total_number -= quantity
                await product.save()
                return {}
                // console.log(product)
            }
        }
    }
    return {}
};

function generateOrderId() {
    const chars = '1234567890abcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 10; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

const add_order = async (req, res) => {
    const order = req.body.order
    const user_id = req.user.id;
    const address = req.body.address;
    const type_pay = req.body.type_pay;
    try {
        if (!order) {
            return res.json({ success: false, message: "Chưa có sản phẩm để thanh toán", color: "text-red-500" });
        }
        if (!address) {
            return res.json({ success: false, message: "Vui lòng chọn địa chỉ giao hàng", color: "text-red-500" });
        }
        if (!(type_pay <= 3 && type_pay >= 0)) {
            return res.json({ success: true, message: "Vui lòng chọn phương thức thanh toán", color: "text-red-500" });
        }
        const cart_items = await Cart.findOne({ user_id: user_id })
        for (let item of order.items) {


            cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
            if (cart_item_Index == -1) {
                return res.json({ success: false, message: "Sản phẩm này bạn đã bỏ khỏi giỏ hàng nên không thể thực hiện thanh toán", color: "text-red-500" })
            }

        }



        check_order = await Order.findOne({ Order_id: order.order_id })
        // console.log(check_order)
        let new_order_id = order.order_id;
        if (check_order) {

            do {
                new_order_id = generateOrderId();
                // console.log(new_product_id);
            } while (await Order.findOne({ Order_id: new_order_id }));
        }

        let order_status = 0;
        if (type_pay == 0 || type_pay == 3) {
            order_status = 0;
        }
        else {

        }
        for (let item of order.items) {
            let flag_check_quantity = await check_quantity(item.product_id, item.color, item.quantity, item.size);


            if (flag_check_quantity.success == false) { return res.json(flag_check_quantity) }
        }
        new_order = new Order({
            Order_id: new_order_id,
            user_id: req.user.id,
            items: order.items,
            total_price: order.total_price,
            address: address,
            type_pay: type_pay,
            status: order_status
        })
        let check_add_success = true
        await new_order.save().catch(err => {
            console.log(err);
            check_add_success = false;
        });
        if (check_add_success) {
            const cart_items = await Cart.findOne({ user_id: user_id })
            for (let item of order.items) {
                let subtract_quantity = await sub_quantity(item.product_id, item.color, item.quantity, item.size);
                // console.log(subtract_quantity);

                cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
                cart_items.items.splice(cart_item_Index, 1);


            }
            cart_items.total_price = cart_items.items.reduce(
                (total, item) => total + item.price_per_one * item.quantity,
                0
            );
            await cart_items.save();
            return res.json({ success: true, message: "Thanh toán Thành công", color: "text-green-500" });
        }
        else {
            return res.json({ success: false, message: "Thanh toán thất bại", color: "text-red-500" });
        }
        // console.log(new_order)
        // return res.json({ success: true, message: "Thanh toán thành công", color: "text-green-500" });

    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
}

module.exports = {
    add_order,
}