const Cart = require('../models/cart');
const Product = require('../models/product');
const { User, validate } = require('../models/user');
const Order = require('../models/Order');
const { type, format } = require('express/lib/response');
const OrderHistory = require('../models/order_history');

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
            let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
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

        let order_status = 1;
        if (type_pay == 0 || type_pay == 3) {
            order_status = 1;
        }
        else {
            return res.json({ message: "đang phát triển" })
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
            status: order_status,
            order_date: Date.now()
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
};



const get_order_detail = async (req, res) => {
    const user_id = req.user.id
    const Order_id = req.body.Order_id
    try {
        if (!Order_id) {
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color })
        }
        order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        if (!order_detail) {
            return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        return res.json({ success: true, order_detail, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const get_list_detail_user = async (req, res) => {
    const user_id = req.user.id;
    try {
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        order_list = await Order.find({ user_id: user_id });
        if (!order_list) {
            return res.json({ success: false, message: "Bạn chưa có đơn hàng nào để xem ", color: "text-red-500" })
        }
        let format_order_list = []
        for (let order of order_list) {
            format_order_list.push({ Order_id: order.Order_id, status: order.status, order_date: order.order_date, total_price: order.total_price })
        }
        return res.json({ success: true, format_order_list, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const get_OrderHistory_log = async (req, res) => {
    user_id = req.user.id;
    Order_id = req.body.Order_id;
    {
        try {
            if (!user_id) {
                return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
            }
            if (!Order_id) {
                return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
            }
            list_OrderHistory = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
            if (!list_OrderHistory) {
                return res.json({ sucess: false, message: "Bạn đã nhập sai id user, order id hoặc đơn hàng này chưa tồn tại", color: "text-red-500" })
            }
            return res.json({ success: true, log: list_OrderHistory.status_history, color: "text-green-500" })

        } catch (err) {
            console.log(err);
            return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
        }
    }
}





///////////////////////////////////////////////////////for admin////////////////////////////////
const get_list_detail_admin = async (req, res) => {
    const user_id = req.body.user_id
    try {
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        order_list = await Order.find({ user_id: user_id });
        if (!order_list) {
            return res.json({ success: false, message: "Bạn chưa có đơn hàng nào để xem ", color: "text-red-500" })
        }
        let format_order_list = []
        for (let order of order_list) {
            format_order_list.push({ Order_id: order.Order_id, status: order.status, order_date: order.order_date, total_price: order.total_price })
        }
        return res.json({ success: true, format_order_list, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const get_order_detail_to_admin = async (req, res) => {
    const user_id = req.body.user_id;
    const Order_id = req.body.Order_id
    try {
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        if (!Order_id) {
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
        }
        order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        if (!order_detail) {
            return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        return res.json({ success: true, order_detail, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};



const update_status_order = async (req, res) => {
    const user_id = req.user.id;
    const Order_id = req.body.Order_id;
    const new_status_order = req.body.new_status_order;
    try {
        if (!Order_id) {
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color })
        } if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        if (!order_detail) {
            return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        let order_history_check = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
        if (!order_history_check) {
            order_history_check = new OrderHistory({
                user_id: user_id,
                Order_id: Order_id,
                status_history: [{
                    status: order_detail.status,
                    day_add: order_detail.order_date
                },
                {
                    status: new_status_order,
                    day_add: Date.now()
                }]
            })
        }
        else {
            for (let i of order_history_check.status_history) {
                if (i.status == new_status_order)
                    return res.json({ success: false, message: "Trạng thái này đã tồn tại", color: "text-red-500" })
            }
            order_history_check.status_history.push({ status: new_status_order, day_add: Date.now() })
        }
        await order_history_check.save()
        order_detail.order_date = new_status_order
        await order_detail.save()
        return res.json({ success: true, message: "Cập nhật trạng thái thành công", color: "text-red-500" })


    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });

    }
};
const get_OrderHistory_log_admin = async (req, res) => {
    user_id = req.body.user_id;
    Order_id = req.body.Order_id;
    {
        try {
            if (!user_id) {
                return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
            }
            if (!Order_id) {
                return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
            }
            list_OrderHistory = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
            if (!list_OrderHistory) {
                return res.json({ sucess: false, message: "Bạn đã nhập sai id user, order id hoặc đơn hàng này chưa tồn tại", color: "text-red-500" })
            }
            return res.json({ success: true, log: list_OrderHistory.status_history, color: "text-green-500" })

        } catch (err) {
            console.log(err);
            return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
        }
    }
};


module.exports = {
    add_order,
    get_order_detail,
    get_list_detail_user,
    get_OrderHistory_log,

    ///for admin///
    get_list_detail_admin,
    get_order_detail_to_admin,
    update_status_order,

    get_OrderHistory_log_admin
}