const Cart = require('../models/cart');
const date = require('date-and-time')
const Product = require('../models/product');
const { User, validate } = require('../models/user');
const Order = require('../models/Order');
const { type, format, status } = require('express/lib/response');
const OrderHistory = require('../models/order_history');
const { createPayment, check_status_momo_payment, refund_money_momo } = require('../controller/momo_payment');
const Transaction = require("../models/transaction");
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const Voucher = require('../models/voucher');

let order_id_list_momo = []

const check_quantity = async (product_id, color, quantity, size) => {
    const product = await Product.findOne({ product_id: product_id });
    if (!product) {
        return {
            success: false,
            message: "Không tìm thấy sản phẩm",
            color: "text-red-500",
        };
    }
    const nameProduct = product?.name;
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

        if (selectedSize.total_number_with_size === 0) {
            return { success: false, message: "Sản phẩm " + nameProduct + " màu " + color + " size " + size + " đã hết hàng", color: "text-red-500" }
        }


        // Check stock availability for the chosen color and size
        if (selectedSize.total_number_with_size < quantity) {
            return { success: false, message: "Số lượng sản phẩm " + nameProduct + " màu " + color + " size " + size + " còn lại không đủ", color: "text-red-500" }

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

            if (selectedColor.total_number_with_color === 0) {
                return { success: false, message: "Sản phẩm " + nameProduct + " màu " + color + " đã hết hàng", color: "text-red-500" }
            }

            if (selectedColor.total_number_with_color < quantity) {
                return { success: false, message: "Số lượng sản phẩm " + nameProduct + " màu " + color + " còn lại không đủ", color: "text-red-500" }
            }
        }
        else {
            if (product.total_number < quantity) {
                return { success: false, message: "Sản phẩm " + nameProduct + " đã hết hàng", color: "text-red-500" }

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
const checkAllMomoPayments = async (req, res) => {

    const order_list = await Order.find({ "type_pay": 1, "status": 0 })
    // console.log(order)
    try {
        for (const order of order_list) {
            console.log("checkAllMomoPayments")
            const paymentResult = await check_status_momo_payment(order.Order_id);
            let resultCode = paymentResult.resultCode
            console.log(
                `Payment status for order ${order.Order_id}:`,
                paymentResult.resultCode
            );
            let newStatus;
            if (resultCode == 1005 || resultCode == 1006) {
                newStatus = 5; // Thanh toán thất bại
                console.log("Thanh toán thất bại");

                // Gọi hàm update_status_order
                const updateReq = {
                    body: {
                        user_id: order.user_id,
                        Order_id: order.Order_id,
                        new_status_order: newStatus,
                    },
                };

                // Tạo một response giả để nhận phản hồi từ update_status_order
                const updateRes = {
                    json: (data) => {
                        console.log('Response from update_status_order:', data);
                        // Trả lại phản hồi từ update_status_order

                    },
                };

                await update_status_order(updateReq, updateRes);
            }
            // Add any additional logic you need to handle the payment result
        }
    } catch (err) {
        console.error("Error checking MoMo payment statuses:", err);
    }
};


const check_status_momo_payment_order = async (req, res) => {
    const orderId = req.body.order_id;
    const paymentResult = await check_status_momo_payment(orderId);
    // console.log(paymentResult)
    return res.json({ message: paymentResult })

}


// const add_order = async (req, res) => {
//     const order = req.body.order;
//     const user_id = req.user.id;
//     const email = req.user.email;
//     const address = req.body.address;
//     const phone = req.body.phone;
//     const name = req.body.name;
//     const type_pay = req.body.type_pay;
//     let shipping_code = req.body.shipping_code;

//     console.log(email);

//     try {
//         if (!order) {
//             return res.json({ success: false, message: "Chưa có sản phẩm để thanh toán", color: "text-red-500" });
//         }
//         if (!address) {
//             return res.json({ success: false, message: "Vui lòng chọn địa chỉ giao hàng", color: "text-red-500" });
//         }
//         if (!phone) {
//             return res.json({ success: false, message: "Vui lòng nhấp số điện thoại liên lạc", color: "text-red-500" });
//         }
//         if (!name) {
//             return res.json({ success: false, message: "Vui lòng nhập tên người liên lạc", color: "text-red-500" });
//         }

//         if (!shipping_code) {
//             if (type_pay == 3) {
//                 shipping_code = 0;
//             }
//         }
//         if (!(type_pay <= 3 && type_pay >= 0)) {
//             return res.status(200).json({ success: true, message: "Vui lòng chọn phương thức thanh toán", color: "text-red-500" });
//         }

//         const cart_items = await Cart.findOne({ user_id: user_id });
//         for (let item of order.items) {
//             let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
//             if (cart_item_Index == -1) {
//                 return res.json({ success: false, message: "Sản phẩm này bạn đã bỏ khỏi giỏ hàng nên không thể thực hiện thanh toán", color: "text-red-500" });
//             }
//         }

//         let check_order = await Order.findOne({ Order_id: order.order_id });
//         let new_order_id = order.order_id;
//         if (check_order) {
//             do {
//                 new_order_id = generateOrderId();
//             } while (await Order.findOne({ Order_id: new_order_id }));
//         }

//         let order_status = 1;
//         if (type_pay == 0 || type_pay == 3) {
//             order_status = 1;
//         } else if (type_pay == 1) {
//             order_status = 0;
//         } else {
//             return res.json({ message: "đang phát triển" });
//         }

//         for (let item of order.items) {
//             let flag_check_quantity = await check_quantity(item.product_id, item.color, item.quantity, item.size);
//             if (flag_check_quantity.success == false) {
//                 return res.json(flag_check_quantity);
//             }
//         }

//         if (type_pay == 1) { // MoMo payment
//             const amount = order.total_price + shipping_code;
//             const orderInfo = 'Thanh toán đơn hàng ' + new_order_id;
//             const deliveryInfo = {
//                 deliveryAddress: address.street +", "+address.wardName+", "+address.districtName+", "+address.provinceName,
//                 deliveryFee: shipping_code.toString(),
//                 quantity: order.items.length
//             };

//             const paymentResult = await createPayment(new_order_id, amount, orderInfo, deliveryInfo);
//             console.log(paymentResult.resultCode);

//             if (paymentResult.resultCode != 0) {
//                 return res.json({ success: false, message: "Khởi Tạo Thanh Toán MOMO thất bại " + paymentResult.errorCode, color: "text-red-500" });
//             }

//             // Save the new order if payment link creation is successful
//             let new_order = new Order({
//                 Order_id: new_order_id,
//                 user_id: req.user.id,
//                 email: email,
//                 items: order.items,
//                 total_price: order.total_price,
//                 address: address,
//                 shipping_code: shipping_code,
//                 phone: phone,
//                 name: name,
//                 price_pay: order.total_price + shipping_code,
//                 type_pay: type_pay,
//                 status: order_status,
//                 order_date: Date.now()
//             });

//             let check_add_success = true;
//             await new_order.save().catch(err => {
//                 console.log(err);
//                 check_add_success = false;
//             });

//             if (check_add_success) {
//                 for (let item of order.items) {
//                     let subtract_quantity = await sub_quantity(item.product_id, item.color, item.quantity, item.size);
//                     let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
//                     cart_items.items.splice(cart_item_Index, 1);
//                 }

//                 cart_items.total_price = cart_items.items.reduce(
//                     (total, item) => total + item.price_per_one * item.quantity,
//                     0
//                 );

//                 await cart_items.save();
//                 order_id_list_momo.push(new_order_id)
//                 console.log(order_id_list_momo)
//                 return res.status(200).json({ success: true, paymentUrl: paymentResult.payUrl });
//             } else {
//                 return res.json({ success: false, message: "Thanh toán thất bại", color: "text-red-500" });
//             }
//         } else {
//             let new_order = new Order({
//                 Order_id: new_order_id,
//                 user_id: req.user.id,
//                 email: email,
//                 items: order.items,
//                 total_price: order.total_price,
//                 address: address,
//                 shipping_code: shipping_code,
//                 phone: phone,
//                 name: name,
//                 price_pay: order.total_price + shipping_code,
//                 type_pay: type_pay,
//                 status: order_status,
//                 order_date: Date.now()
//             });

//             let check_add_success = true;
//             await new_order.save().catch(err => {
//                 console.log(err);
//                 check_add_success = false;
//             });

//             if (check_add_success) {
//                 for (let item of order.items) {
//                     let subtract_quantity = await sub_quantity(item.product_id, item.color, item.quantity, item.size);
//                     let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
//                     cart_items.items.splice(cart_item_Index, 1);
//                 }

//                 cart_items.total_price = cart_items.items.reduce(
//                     (total, item) => total + item.price_per_one * item.quantity,
//                     0
//                 );

//                 await cart_items.save();

//                 return res.status(200).json({ success: true, message: "Thanh toán Thành công", color: "text-green-500" });
//             } else {
//                 return res.json({ success: false, message: "Thanh toán thất bại", color: "text-red-500" });
//             }
//         }
//     } catch (err) {
//         console.log(err);
//         return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
//     }
// };


const add_order = async (req, res) => {
    const order = req.body.order;
    const user_id = req.user.id;
    const email = req.user.email;
    const address = req.body.address;
    const phone = req.body.phone;
    const name = req.body.name;
    const type_pay = req.body.type_pay;
    const list_voucher = req.body.list_voucher
    let checkout_price = req.body.checkout_price;

    let shipping_code = req.body.shipping_code;

    console.log(email);

    try {
        if (!order) {
            return res.status(400).json({ success: false, message: "Chưa có sản phẩm để thanh toán", color: "text-red-500" });
        }
        if (!address) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn địa chỉ giao hàng", color: "text-red-500" });
        }
        if (!phone) {
            return res.status(400).json({ success: false, message: "Vui lòng nhấp số điện thoại liên lạc", color: "text-red-500" });
        }
        if (!name) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập tên người liên lạc", color: "text-red-500" });
        }



        if (!shipping_code) {
            if (type_pay == 3) {
                shipping_code = 0;
            }
        }
        if (!(type_pay <= 3 && type_pay >= 0)) {
            return res.status(200).json({ success: true, message: "Vui lòng chọn phương thức thanh toán", color: "text-red-500" });
        }

        const cart_items = await Cart.findOne({ user_id: user_id });
        for (let item of order.items) {
            let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
            if (cart_item_Index == -1) {
                return res.status(400).json({ success: false, message: "Sản phẩm này bạn đã bỏ khỏi giỏ hàng nên không thể thực hiện thanh toán", color: "text-red-500" });
            }
        }

        let check_order = await Order.findOne({ Order_id: order.order_id });
        let new_order_id = order.order_id;
        if (check_order) {
            do {
                new_order_id = generateOrderId();
            } while (await Order.findOne({ Order_id: new_order_id }));
        }

        let order_status = 1;
        if (type_pay == 0 || type_pay == 3) {
            order_status = 1;
        } else if (type_pay == 1) {
            order_status = 0;
        } else {
            return res.json({ message: "đang phát triển" });
        }

        for (let item of order.items) {
            let flag_check_quantity = await check_quantity(item.product_id, item.color, item.quantity, item.size);
            if (flag_check_quantity.success == false) {
                return res.status(500).json(flag_check_quantity);
            }
        }

        if (type_pay == 1) { // MoMo payment
            const amount = checkout_price + shipping_code;
            const orderInfo = 'Thanh toán đơn hàng ' + new_order_id;
            const deliveryInfo = {
                deliveryAddress: address.street + ", " + address.wardName + ", " + address.districtName + ", " + address.provinceName,
                deliveryFee: shipping_code.toString(),
                quantity: order.items.length
            };

            const paymentResult = await createPayment(new_order_id, amount, orderInfo, deliveryInfo);
            console.log(paymentResult.resultCode);

            if (paymentResult.resultCode != 0) {
                return res.status(500).json({ success: false, message: "Khởi Tạo Thanh Toán MOMO thất bại " + paymentResult.errorCode, color: "text-red-500" });
            }

            // Save the new order if payment link creation is successful
            let new_order = new Order({
                Order_id: new_order_id,
                user_id: req.user.id,
                email: email,
                items: order.items,
                total_price: checkout_price,
                address: address,
                shipping_code: shipping_code,
                phone: phone,
                name: name,
                price_pay: checkout_price + shipping_code,
                type_pay: type_pay,
                status: order_status,
                order_date: Date.now(),
                paymentUrl: paymentResult.payUrl // Save the payment URL here
            });

            let check_add_success = true;
            await new_order.save().catch(err => {
                console.log(err);
                check_add_success = false;
            });

            if (check_add_success) {
                for (let item of order.items) {
                    let product = await Product.findOne({ product_id: item.product_id });

                    if (product) {
                        // Tăng số lượng mua cho sản phẩm
                        product.quantityBought += item.quantity;
                        await product.save();
                    }
                    let subtract_quantity = await sub_quantity(item.product_id, item.color, item.quantity, item.size);
                    let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
                    cart_items.items.splice(cart_item_Index, 1);
                }

                cart_items.total_price = cart_items.items.reduce(
                    (total, item) => total + item.price_per_one * item.quantity,
                    0
                );

                await cart_items.save();
                // === CẬP NHẬT USER_ID VÀO VOUCHER ===
                if (list_voucher && Array.isArray(list_voucher)) {
                    for (let code of list_voucher) {
                        await Voucher.findOneAndUpdate(
                            {
                                code,
                                limit: { $gt: 0 },
                                userId: { $ne: user_id.toString() }
                            },
                            {
                                $addToSet: { userId: user_id.toString() },
                                $inc: { limit: -1 }
                            }
                        );
                    }
                }
                order_id_list_momo.push(new_order_id)
                console.log(order_id_list_momo)
                return res.status(200).json({ success: true, paymentUrl: paymentResult.payUrl });
            } else {
                return res.status(500).json({ success: false, message: "Thanh toán thất bại", color: "text-red-500" });
            }
        } else {
            let new_order = new Order({
                Order_id: new_order_id,
                user_id: req.user.id,
                email: email,
                items: order.items,
                total_price: checkout_price,
                address: address,
                shipping_code: shipping_code,
                phone: phone,
                name: name,
                price_pay: checkout_price + shipping_code,
                type_pay: type_pay,
                status: order_status,
                order_date: Date.now()
            });

            let check_add_success = true;
            await new_order.save().catch(err => {
                console.log(err);
                check_add_success = false;
            });

            if (check_add_success) {
                for (let item of order.items) {
                    let subtract_quantity = await sub_quantity(item.product_id, item.color, item.quantity, item.size);
                    let cart_item_Index = cart_items.items.findIndex(item_cart => item_cart._id.toString() == item._id.toString());
                    cart_items.items.splice(cart_item_Index, 1);
                }

                cart_items.total_price = cart_items.items.reduce(
                    (total, item) => total + item.price_per_one * item.quantity,
                    0
                );

                await cart_items.save();
                // === CẬP NHẬT USER_ID VÀO VOUCHER ===
                if (list_voucher && Array.isArray(list_voucher)) {
                    for (let code of list_voucher) {
                        await Voucher.findOneAndUpdate(
                            {
                                code,
                                limit: { $gt: 0 },
                                userId: { $ne: user_id.toString() }
                            },
                            {
                                $addToSet: { userId: user_id.toString() },
                                $inc: { limit: -1 }
                            }
                        );
                    }
                }

                return res.status(200).json({ success: true, message: "Thanh toán Thành công", color: "text-green-500" });
            } else {
                return res.status(500).json({ success: false, message: "Thanh toán thất bại", color: "text-red-500" });
            }
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};


const callback = async (req, res) => {
    console.log("callback");
    const { resultCode, orderId } = req.body;

    try {
        console.log("check");

        const order = await Order.findOne({ Order_id: orderId });
        if (!order) {
            console.log("Order not found");
            return res.status(404).json({ success: false, message: "Order not found", color: "text-red-500" });
        }

        // Đặt trạng thái mới dựa trên kết quả thanh toán
        let newStatus;
        if (resultCode == 0) {
            newStatus = 1; // Thanh toán thành công
            console.log("Thanh toán thành công");
        } else {
            newStatus = 5; // Thanh toán thất bại
            console.log("Thanh toán thất bại");
        }

        // Gọi hàm update_status_order
        const updateReq = {
            body: {
                user_id: order.user_id,
                Order_id: orderId,
                new_status_order: newStatus
            }
        };

        // Tạo một response giả để nhận phản hồi từ update_status_order
        const updateRes = {
            json: (data) => {
                console.log(data);
                // Trả lại phản hồi từ update_status_order
                res.json(data);
            }
        };

        await update_status_order(updateReq, updateRes);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const handleMomoNotification = async (req, res) => {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;

    // Verify the signature
    const rawData = `partnerCode=${partnerCode}&orderId=${orderId}&requestId=${requestId}&amount=${amount}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;
    const expectedSignature = generateSignature(rawData, secretKey);

    if (signature !== expectedSignature) {
        return res.status(400).json({ message: "Invalid signature" });
    }

    if (resultCode === 0) {
        // Payment successful
        const order = await Order.findOne({ Order_id: orderId });
        if (order) {
            order.status = 1; // Update order status to paid
            await order.save();
        }
    } else {
        // Payment failed
        console.log("Payment failed:", message);
    }

    res.status(200).json({ message: "Notification received" });
};

const get_order_detail = async (req, res) => {
    const user_id = req.user.id
    const Order_id = req.body.Order_id
    try {
        if (!Order_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color })
        }
        const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        const formatted_order_detail = {
            _id: order_detail._id,
            Order_id: order_detail.Order_id,
            email: order_detail.email,
            user_id: order_detail.user_id,
            items: order_detail.items,
            total_price: order_detail.total_price,
            address: order_detail.address,
            shipping_code: order_detail.shipping_code,
            price_pay: order_detail.total_price + order_detail.shipping_code,
            phone: order_detail.phone,
            name: order_detail.name,
            type_pay: order_detail.type_pay,
            status: order_detail.status,
            paymentUrl: order_detail.paymentUrl,
            list_image: order_detail.refund_request.list_image,
            description: order_detail.refund_request.description,
            refund_date: moment(order_detail.refund_request.refund_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"),
            order_date: moment(order_detail.order_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss")
        }
        if (!order_detail) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        return res.status(200).json({ success: true, formatted_order_detail, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const get_list_detail_user = async (req, res) => {
    const user_id = req.user.id;
    const req_status = req.query.status
    const req_sort = req.query.sort
    const search = req.query.search?.trim();

    try {
        let type_sort
        const filter = { user_id };
        if (req_status != -1) filter.status = req_status;
        if (search) {
            filter.$or = [
                { Order_id: { $regex: search, $options: "i" } },
                { "items.product_name": { $regex: search, $options: "i" } }
            ];
        }
        if (req_sort != -1) { type_sort = 1 }
        else {
            type_sort = parseInt(req_sort)
        }
        if (!user_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        let order_list

        // if (req_status == -1) { order_list = await Order.find({ user_id: user_id }).sort({ "order_date": type_sort }); }
        // else {
        //     order_list = await Order.find({ user_id: user_id, status: req_status }).sort({ "order_date": type_sort });
        // }

        order_list = await Order.find(filter).sort({ "order_date": type_sort });
        console.log(order_list)
        if (!order_list) {
            return res.status(404).json({ success: false, message: "Bạn chưa có đơn hàng nào để xem ", color: "text-red-500" })
        }
        // let format_order_list = []
        // for (let order of order_list) {
        //     format_order_list.push({ Order_id: order.Order_id, status: order.status, order_date: moment(order.order_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"), price_pay: order.price_pay, paymentUrl: order.paymentUrl })
        // }
        const format_order_list = order_list.map(order => ({
            Order_id: order.Order_id,
            status: order.status,
            order_date: moment(order.order_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"),
            price_pay: order.price_pay,
            paymentUrl: order.paymentUrl,
            items: order.items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                image_hover: item.image_hover
            }))
        }));

        return res.status(200).json({ success: true, format_order_list, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const get_OrderHistory_log = async (req, res) => {
    const user_id = req.user.id;
    const Order_id = req.body.Order_id;
    try {
        if (!user_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        if (!Order_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
        }
        const list_OrderHistory = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
        if (!list_OrderHistory) {
            return res.status(200).json({ success: true, log: [], color: "text-green-500" })
        }

        const log_list_OrderHistory = list_OrderHistory.status_history.filter(item => item.status !== 0).map(item => ({
            status: item.status,
            day_add: moment(item.day_add).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss")
        }));
        return res.status(200).json({ success: true, log: log_list_OrderHistory, color: "text-green-500" })

    } catch (err) {
        console.log(err);
        return res.status(200).json({ success: true, log: [], color: "text-green-500" });
    }
}
const refund_momo_money = async (req, res) => {
    const Order_id = req.body.Order_id;

    const user_id = req.user.id
    const check_order = await Order.findOne({ Order_id: Order_id, user_id: user_id })
    try {
        if (!Order_id) {
            return res.json({ success: false, message: "Mã đơn hàng không đước đễ trống", color: "text-red-500" })

        }
        if (!check_order) {
            return res.json({ success: false, message: "Mã đơn hàng này không phải của khách hàng hiện tại", color: "text-red-500" })
        }
        const paymentResult = await check_status_momo_payment(Order_id);
        console.log(paymentResult)
        if (paymentResult.resultCode == 0) {
            const amount = check_order.price_pay;
            const payment_refund_result = await refund_money_momo(Order_id, paymentResult.transId, amount)
            console.log(payment_refund_result)
            if (payment_refund_result.resultCode == 0) {
                let newStatus = 6; // Thanh toán thất bại

                // Gọi hàm update_status_order
                const updateReq = {
                    body: {
                        user_id: user_id,
                        Order_id: Order_id,
                        new_status_order: newStatus,
                    },
                };

                // Tạo một response giả để nhận phản hồi từ update_status_order
                const updateRes = {
                    json: (data) => {
                        console.log('Response from update_status_order:', data);
                        // Trả lại phản hồi từ update_status_order

                    },
                };

                await update_status_order(updateReq, updateRes);
                return res.json({ success: true, message: "Hoàn tiền thành công", color: "text-green-500" })
            }
            else {
                return res.json({ success: false, message: "Hoàn tiền thất bại", color: "text-red-500" })
            }
        }
    }
    catch (err) {
        console.log(err)
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
    }

}


const cancer_order = async (req, res) => {
    const Order_id = req.body.Order_id;

    const user_id = req.user.id
    const check_order = await Order.findOne({ Order_id: Order_id, user_id: user_id })
    try {
        if (!Order_id) {
            return res.json({ success: false, message: "Mã đơn hàng không đước đễ trống", color: "text-red-500" })

        }
        if (!check_order) {
            return res.json({ success: false, message: "Mã đơn hàng này không phải của khách hàng hiện tại", color: "text-red-500" })
        }
        // const paymentResult = await check_status_momo_payment(Order_id);
        // console.log(paymentResult)
        // if (paymentResult.resultCode==0)
        // {
        //     const amount=check_order.price_pay;
        //     const payment_refund_result= await refund_money_momo(Order_id,paymentResult.transId,amount)
        //     console.log(payment_refund_result)
        // if (payment_refund_result.resultCode==0)
        // {
        if (check_order.type_pay != 0) {
            return res.json({ success: false, message: "Sai phương thức huỷ đơn", color: "text-red-500" })
        }
        let newStatus = 5; // Thanh toán thất bại

        // Gọi hàm update_status_order
        const updateReq = {
            body: {
                user_id: user_id,
                Order_id: Order_id,
                new_status_order: newStatus,
            },
        };

        // Tạo một response giả để nhận phản hồi từ update_status_order
        const updateRes = {
            json: (data) => {
                console.log('Response from update_status_order:', data);
                // Trả lại phản hồi từ update_status_order

            },
        };

        await update_status_order(updateReq, updateRes);
        return res.json({ success: true, message: "Hoàn tiền thành công", color: "text-green-500" })
    }
    // else
    // {
    //     return res.json({success:false,message:"Hoàn tiền thất bại",color:"text-red-500"})
    // }

    catch (err) {
        console.log(err)
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
    }

}

const add_description_fop_refund = async (req, res) => {
    const Order_id = req.body.Order_id;
    const list_image = req.body.list_image;
    const description = req.body.description;
    const user_id = req.user.id;
    try {
        if (!Order_id) {
            return res.status(400).json({ success: false, message: "Mã đơn hàng không đước đễ trống", color: "text-red-500" })
        }
        if (!list_image) {
            return res.status(400).json({ success: false, message: "Danh sách ảnh minh chứng không đước đễ trống", color: "text-red-500" })
        }
        if (!description) {
            return res.status(400).json({ success: false, message: "Lý do yêu cầu hoàn tiền không đước đễ trống", color: "text-red-500" })
        }
        const order = await Order.findOne({ Order_id, user_id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }
        if (!order.refund_request) {
            order.refund_request = {};
        }
        const refund_date = new Date();
        order.refund_request = { list_image, description, refund_date };
        order.status = 8

        let orderHistory = await OrderHistory.findOne({ user_id, Order_id });

        orderHistory?.status_history?.push({ status: 8, day_add: refund_date });
        await orderHistory.save();

        await order.save().then(() => {
            res.status(200).json({ success: true, message: "Yêu cầu hoàn tiền đã được gửi", color: "text-green-500" });
        })
            .catch((err) => {
                console.error("Error saving order:", err);
                res.status(500).json({ success: false, message: "Lỗi khi lưu yêu cầu hoàn tiền", color: "text-red-500" });
            });
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
    }
}



const refund_momo_money_admin = async (req, res) => {
    const Order_id = req.body.Order_id;

    const user_id = req.body.user_id
    const check_order = await Order.findOne({ Order_id: Order_id, user_id: user_id })
    try {
        if (!Order_id) {
            return res.json({ success: false, message: "Mã đơn hàng không đước đễ trống", color: "text-red-500" })

        }
        if (!check_order) {
            return res.json({ success: false, message: "Mã đơn hàng này không phải của khách hàng hiện tại", color: "text-red-500" })
        }
        const paymentResult = await check_status_momo_payment(Order_id);
        console.log(paymentResult)
        if (paymentResult.resultCode == 0) {
            const amount = check_order.price_pay;
            const payment_refund_result = await refund_money_momo(Order_id, paymentResult.transId, amount)
            console.log(payment_refund_result)
            if (payment_refund_result.resultCode == 0) {
                let newStatus = 6; // Thanh toán thất bại

                // Gọi hàm update_status_order
                const updateReq = {
                    body: {
                        user_id: user_id,
                        Order_id: Order_id,
                        new_status_order: newStatus,
                    },
                };

                // Tạo một response giả để nhận phản hồi từ update_status_order
                const updateRes = {
                    json: (data) => {
                        console.log('Response from update_status_order:', data);
                        // Trả lại phản hồi từ update_status_order

                    },
                };

                await update_status_order(updateReq, updateRes);
                return res.json({ success: true, message: "Hoàn tiền thành công", color: "text-green-500" })
            }
            else {
                return res.json({ success: false, message: "Hoàn tiền thất bại", color: "text-red-500" })
            }
        }
    }
    catch (err) {
        console.log(err)
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" })
    }

}

setInterval(checkAllMomoPayments, 300000);


///////////////////////////////////////////////////////for admin////////////////////////////////
const get_list_detail_admin = async (req, res) => {
    const user_id = req.body.user_id
    const req_status = req.query.status
    const req_sort = req.query.sort
    try {
        let type_sort
        if (req_sort != -1) { type_sort = 1 }
        else {
            type_sort = parseInt(req_sort)
        }
        if (!user_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        let order_list
        if (req_status == -1) {
            order_list = await Order.find({ user_id: user_id }).sort({ "order_date": type_sort });
        } else { order_list = await Order.find({ user_id: user_id, status: req_status }).sort({ "order_date": type_sort }); }
        if (!order_list) {
            return res.status(404).json({ success: false, message: "Bạn chưa có đơn hàng nào để xem ", color: "text-red-500" })
        }
        let format_order_list = []
        for (let order of order_list) {
            format_order_list.push({ user_id: user_id, Order_id: order.Order_id, status: order.status, order_date: moment(order.order_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"), price_pay: order.price_pay, paymentUrl: order.paymentUrl })
        }
        return res.status(200).json({ success: true, format_order_list, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const get_order_detail_to_admin = async (req, res) => {
    const user_id = req.body.user_id;
    const Order_id = req.body.Order_id
    try {
        if (!user_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        if (!Order_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
        }
        const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        if (!order_detail) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        const formatted_order_detail = {
            _id: order_detail._id,
            Order_id: order_detail.Order_id,
            user_id: order_detail.user_id,
            emai: order_detail.email,
            items: order_detail.items,
            total_price: order_detail.total_price,
            address: order_detail.address,
            phone: order_detail.phone,
            name: order_detail.name,
            shipping_code: order_detail.shipping_code,
            price_pay: order_detail.total_price + order_detail.shipping_code,
            type_pay: order_detail.type_pay,
            status: order_detail.status,
            list_image: order_detail.refund_request.list_image,
            description: order_detail.refund_request.description,
            refund_date: moment(order_detail.refund_request.refund_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"),
            order_date: moment(order_detail.order_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss")
        }
        return res.status(200).json({ success: true, formatted_order_detail, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const get_full_order_table = async (req, res) => {
    const req_status = req.query.status
    const req_sort = req.query.sort
    const orderId = req.query.orderId
    try {
        let type_sort
        if (req_sort != -1) { type_sort = 1 }
        else {
            type_sort = parseInt(req_sort)
        }
        let full_Order_table
        if (req_status == -1) {
            full_Order_table = await Order.find({}).sort({ "order_date": type_sort })
        }
        else {
            if (orderId) {
                full_Order_table = await Order.find({ Order_id: orderId }).sort({ "order_date": type_sort })
            } else {
                full_Order_table = await Order.find({ status: req_status }).sort({ "order_date": type_sort })
            }
        }

        let formatted_Order_table = []
        for (let order of full_Order_table) {
            formatted_Order_table.push({ user_id: order.user_id, Order_id: order.Order_id, status: order.status, order_date: moment(order.order_date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss"), price_pay: order.price_pay })
        }
        return res.status(200).json({ success: true, formatted_Order_table, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
}

// const update_status_order = async (req, res) => {
//     const user_id = req.body.user_id;
//     const Order_id = req.body.Order_id;
//     const new_status_order = req.body.new_status_order;
//     try {
//         if (!Order_id) {
//             return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn cập nhật", color: "text-red-500" })
//         }
//         if (!user_id) {
//             return res.json({ success: false, message: "Vui lòng chọn người dùng để cập nhật hóa đơn mua hàng của họ ", color: "text-red-500" })
//         }
//         const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
//         if (!order_detail) {
//             return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
//         }
//         let order_history_check = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
//         console.log(order_history_check)
//         if (!order_history_check) {
//             order_history_check = new OrderHistory({
//                 user_id: user_id,
//                 Order_id: Order_id,
//                 status_history: [{
//                     status: order_detail.status,
//                     day_add: order_detail.order_date
//                 },
//                 {
//                     status: new_status_order,
//                     day_add: Date.now()
//                 }]
//             })
//         }
//         else {
//             // for (let i of order_history_check.status_history) {
//             //     if (i.status == new_status_order)
//             //         return res.json({ success: false, message: "Trạng thái này đã tồn tại", color: "text-red-500" })
//             // }
//             order_history_check.status_history.push({ status: new_status_order, day_add: Date.now() })
//         }
//         await order_history_check.save()
//         order_detail.status = new_status_order
//         await order_detail.save()
//         if (new_status_order === 4 || (order_detail.type_pay == 1 && new_status_order === 1)) {
//             const transaction = new Transaction({
//                 order_id: Order_id,
//                 price_pay: order_detail.price_pay,
//                 user_id: user_id,
//                 email: order_detail.email,
//                 // Giả sử trường này tồn tại trong order_detail
//                 create_date: new Date()
//             });
//             await transaction.save();
//         }
//         return res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", color: "text-red-500" })


//     } catch (err) {
//         console.log(err);
//         return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });

//     }
// };

// const update_status_order = async (req, res) => {
//     const user_id = req.body.user_id;
//     const Order_id = req.body.Order_id;
//     const new_status_order = req.body.new_status_order;

//     try {
//         if (!Order_id) {
//             return res.status(400).json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn cập nhật", color: "text-red-500" });
//         }
//         if (!user_id) {
//             return res.status(400).json({ success: false, message: "Vui lòng chọn người dùng để cập nhật hóa đơn mua hàng của họ", color: "text-red-500" });
//         }

//         const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
//         if (!order_detail) {
//             return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" });
//         }

//         let order_history_check = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id });
//         if (!order_history_check) {
//             order_history_check = new OrderHistory({
//                 user_id: user_id,
//                 Order_id: Order_id,
//                 status_history: [
//                     {
//                         status: order_detail.status,
//                         day_add: order_detail.order_date,
//                     },
//                     {
//                         status: new_status_order,
//                         day_add: Date.now(),
//                     }
//                 ]
//             });
//         } else {
//             order_history_check.status_history.push({ status: new_status_order, day_add: Date.now() });
//         }

//         await order_history_check.save();

//         // Update the order status
//         order_detail.status = new_status_order;
//         await order_detail.save();

//         // Check if status is 5 or 6 and status 5 is not present in history
//         const hasStatus5 = order_history_check.status_history.some(history => history.status === 5);

//         if ((new_status_order === 5 || (new_status_order === 6 && !hasStatus5))) {
//             for (const item of order_detail.items) {
//                 const product_data = await Product.findOne({ product_id: item.product_id });

//                 if (product_data) {
//                     // Update the total number of the product
//                     product_data.total_number += item.quantity;

//                     // Find the correct color and size in the product
//                     const colorItem = product_data.array_color.find(color => color.name_color === item.color);
//                     if (colorItem) {
//                         colorItem.total_number_with_color += item.quantity;

//                         if (item.size) {
//                             const sizeItem = colorItem.array_sizes.find(size => size.name_size === item.size);
//                             if (sizeItem) {
//                                 sizeItem.total_number_with_size += item.quantity;
//                             }
//                         }
//                     }

//                     await product_data.save();
//                 }
//             }

//             const transaction_refund = new Transaction({
//                 order_id: Order_id,
//                 price_pay: -order_detail.price_pay,
//                 user_id: user_id,
//                 email: order_detail.email,
//                 create_date: new Date()
//             });
//             await transaction_refund.save();
//         }

//         // Handle transactions when status is 4 (completed) or payment is pending (new_status_order === 1)
//         if (new_status_order === 4 || (order_detail.type_pay == 1 && new_status_order === 1)) {
//             const transaction = new Transaction({
//                 order_id: Order_id,
//                 price_pay: order_detail.price_pay,
//                 user_id: user_id,
//                 email: order_detail.email,
//                 create_date: new Date()
//             });
//             await transaction.save();
//         }


//         return res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", color: "text-green-500" });

//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
//     }
// };
const update_status_order = async (req, res) => {
    const { user_id, Order_id, new_status_order } = req.body;

    if (!Order_id || !user_id || new_status_order === undefined) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin yêu cầu", color: "text-red-500" });
    }

    try {
        const order = await Order.findOne({ user_id, Order_id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng", color: "text-red-500" });
        }

        let orderHistory = await OrderHistory.findOne({ user_id, Order_id });

        if (!orderHistory) {
            orderHistory = new OrderHistory({
                user_id,
                Order_id,
                status_history: [{ status: order.status, day_add: order.order_date }]
            });
        }

        const hasStatus4 = orderHistory.status_history.some(h => h.status === 4);
        const hasStatus5 = orderHistory.status_history.some(h => h.status === 5);

        if (new_status_order === 5 && hasStatus4 && !hasStatus5) {
            await adjustQuantityBought(order.items, -1);
        }

        if ((new_status_order === 5 || new_status_order === 6) && !hasStatus5) {
            await restoreStock(order.items);
            await deleteTransaction(Order_id);
        }

        if ((new_status_order === 4 && order.type_pay === 0) || (order.type_pay === 1 && new_status_order === 1)) {
            await createTransaction(Order_id, order.price_pay, user_id, order.email);
        }

        order.status = new_status_order;
        await order.save();

        orderHistory.status_history.push({ status: new_status_order, day_add: new Date() });
        await orderHistory.save();

        res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", color: "text-green-500" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Lỗi xử lý dữ liệu", color: "text-red-500" });
    }
};

// Giảm quantityBought cho sản phẩm
const adjustQuantityBought = async (items, factor) => {
    for (const item of items) {
        const product = await Product.findOne({ product_id: item.product_id });
        if (product) {
            product.quantityBought += item.quantity * factor;
            await product.save();
        }
    }
};

// Khôi phục số lượng tồn kho
const restoreStock = async (items) => {
    for (const item of items) {
        const product = await Product.findOne({ product_id: item.product_id });
        if (product) {
            product.total_number += item.quantity;

            const color = product.array_color.find(c => c.name_color === item.color);
            if (color) {
                color.total_number_with_color += item.quantity;

                if (item.size) {
                    const size = color.array_sizes.find(s => s.name_size === item.size);
                    if (size) {
                        size.total_number_with_size += item.quantity;
                    }
                }
            }

            await product.save();
        }
    }
};

// Tạo giao dịch
const createTransaction = async (order_id, amount, user_id, email) => {
    const transaction = new Transaction({
        order_id,
        price_pay: amount,
        user_id,
        email,
    });
    await transaction.save();
};

const deleteTransaction = async (order_id) => {
    const transaction = await Transaction.findOne({ order_id, price_pay: { $gt: 0 } });
    if (transaction) {
        await transaction.deleteOne();
    }
}


const get_OrderHistory_log_admin = async (req, res) => {
    const user_id = req.body.user_id;
    const Order_id = req.body.Order_id;
    try {
        if (!user_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        if (!Order_id) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
        }
        const list_OrderHistory = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
        if (!list_OrderHistory) {
            return res.json({ sucess: false, message: "Bạn đã nhập sai id user, order id hoặc đơn hàng này chưa tồn tại", color: "text-red-500" })
        }
        const log_list_OrderHistory = {
            status: list_OrderHistory.status_history.status,
            day_add: moment(list_OrderHistory.status_history.day_add).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss")
        }
        return res.status(200).json({ success: true, log: log_list_OrderHistory, color: "text-green-500" })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};


module.exports = {
    add_order,
    get_order_detail,
    get_list_detail_user,
    get_OrderHistory_log,
    handleMomoNotification,
    callback,
    check_status_momo_payment_order,
    checkAllMomoPayments,
    refund_momo_money,
    cancer_order,
    add_description_fop_refund,

    ///for admin///
    get_list_detail_admin,
    get_order_detail_to_admin,
    update_status_order,
    get_full_order_table,
    get_OrderHistory_log_admin,
    refund_momo_money_admin
}