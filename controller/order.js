const Cart = require('../models/cart');
const date = require('date-and-time')
const Product = require('../models/product');
const { User, validate } = require('../models/user');
const Order = require('../models/Order');
const { type, format, status } = require('express/lib/response');
const OrderHistory = require('../models/order_history');
const { createPayment } = require('../controller/momo_payment');
const Transaction =require("../models/transaction");

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
    const phone=req.body.phone;
    const name=req.body.name;
    const type_pay = req.body.type_pay;
    let shipping_code=req.body.shipping_code
    try {
        if (!order) {
            return res.json({ success: false, message: "Chưa có sản phẩm để thanh toán", color: "text-red-500" });
        }
        if (!address) {
            return res.json({ success: false, message: "Vui lòng chọn địa chỉ giao hàng", color: "text-red-500" });
        }
        if (!phone)
        {
            return res.json({ success: false, message: "Vui lòng nhấp số điện thoại liên lạc", color: "text-red-500" });
        }
        if (!name)
        {
            return res.json({ success: false, message: "Vui lòng nhập tên người liên lạc", color: "text-red-500" });
        }
        if (!shipping_code)
        {
            if (type_pay==3)
            {
                shipping_code=0
            }
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



        let check_order = await Order.findOne({ Order_id: order.order_id })
        // console.log(check_order)
        let new_order_id = order.order_id;
        if (check_order) {

            do {
                new_order_id = generateOrderId();
                // console.log(new_product_id);
            } while (await Order.findOne({ Order_id: new_order_id }));
        }

        let order_status = 1;
        if (type_pay == 0 || type_pay == 3 ||type_pay==1 ) {
            order_status = 1;
        }
        // else if (type_pay == 1) { // MoMo payment
        //     const amount = order.total_price + shipping_code;
        //     const orderInfo = 'Thanh toán đơn hàng ' + new_order_id;
            

        //     const deliveryInfo = {
        //         deliveryAddress: address,
        //         deliveryFee: shipping_code.toString(),
        //         quantity: order.items.length
        //     };

        //     const paymentResult = await createPayment(new_order_id, amount, orderInfo, deliveryInfo);
        //     console.log(paymentResult.resultCode)
        //     if(paymentResult.resultCode!=0)
        //     {   
        //         return res.json({success: false, message: "Khởi Tạo Thanh Toán MOMO thất bại "+paymentResult.errorCode, color: "text-red-500"})
        //     }
            
        //     // if (paymentResult.errorCode !== 0) {
        //     //     return res.json({ success: false, message: "Thanh toán thất bại "+paymentResult.errorCode, color: "text-red-500" });
        //     // }

        //     // Redirect user to MoMo payment page
        //     return res.json({ success: true, paymentUrl: paymentResult });
        // } 
        else {
            return res.json({ message: "đang phát triển" });
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
            shipping_code:shipping_code,
            phone:phone,
            name:name,
            price_pay:order.total_price+shipping_code,
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
            if (type_pay == 1) { // MoMo payment
                const amount = order.total_price + shipping_code;
                const orderInfo = 'Thanh toán đơn hàng ' + new_order_id;
                
    
                const deliveryInfo = {
                    deliveryAddress: address,
                    deliveryFee: shipping_code.toString(),
                    quantity: order.items.length
                };
    
                const paymentResult = await createPayment(new_order_id, amount, orderInfo, deliveryInfo);
                console.log(paymentResult.resultCode)
                if(paymentResult.resultCode!=0)
                {   
                    return res.json({success: false, message: "Khởi Tạo Thanh Toán MOMO thất bại "+paymentResult.errorCode, color: "text-red-500"})
                }
                
                // if (paymentResult.errorCode !== 0) {
                //     return res.json({ success: false, message: "Thanh toán thất bại "+paymentResult.errorCode, color: "text-red-500" });
                // }
    
                // Redirect user to MoMo payment page
                return res.json({ success: true, paymentUrl: paymentResult });
            } 
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
const callback= async(req,res) => {
    console.log("callback");
    const { resultCode, orderId } = req.body;

    try {
        console.log("check");

        const order = await Order.findOne({ Order_id: orderId });
        if (!order) {
            console.log("Order not found");
            return res.json({ success: false, message: "Order not found", color: "text-red-500" });
        }

        // Đặt trạng thái mới dựa trên kết quả thanh toán
        let newStatus;
        if (resultCode == 0) {
            newStatus = 4; // Thanh toán thành công
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
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
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
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color })
        }
        const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        const formatted_order_detail ={
            _id:order_detail._id,
            Order_id:order_detail.Order_id,
            user_id:order_detail.user_id,
            items:order_detail.items,
            total_price:order_detail.total_price,
            address:order_detail.address,
            shipping_code:order_detail.shipping_code,
            price_pay:order_detail.total_price+order_detail.shipping_code,
            phone:order_detail.phone,
            name:order_detail.name,
            type_pay:order_detail.type_pay,
            status:order_detail.status,
            order_date: date.format(order_detail.order_date,"DD/MM/YYYY")
        }
       if (!order_detail) {
            return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        return res.json({ success: true, formatted_order_detail, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const get_list_detail_user = async (req, res) => {
    const user_id = req.user.id;
    const req_status=req.query.status
    const req_sort=req.query.sort
     
    try {
        let type_sort
        if (req_sort!=-1)
            {type_sort=1}
        else
        {
            type_sort=parseInt(req_sort)
        }
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        let order_list
        if(req_status==0)
        { order_list = await Order.find({ user_id: user_id }).sort({"order_date":type_sort});}
        else
        {
             order_list=await Order.find({ user_id: user_id ,status:req_status}).sort({"order_date":type_sort});
        }
        console.log(order_list)
        if (!order_list) {
            return res.json({ success: false, message: "Bạn chưa có đơn hàng nào để xem ", color: "text-red-500" })
        }
        let format_order_list = []
        for (let order of order_list) {
            format_order_list.push({ Order_id: order.Order_id, status: order.status, order_date: date.format(order.order_date,"DD/MM/YYYY"), price_pay: order.price_pay })
        }
        
        return res.json({ success: true, format_order_list, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};
const get_OrderHistory_log = async (req, res) => {
    const user_id = req.user.id;
    const Order_id = req.body.Order_id;
    try {
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        if (!Order_id) {
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
        }
        const list_OrderHistory = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
        if (!list_OrderHistory) {
            return res.json({ success: false, message: "Bạn đã nhập sai id user, order id hoặc đơn hàng này chưa tồn tại", color: "text-red-500" })
        }
        return res.json({ success: true, log: list_OrderHistory.status_history, color: "text-green-500" })

    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
}





///////////////////////////////////////////////////////for admin////////////////////////////////
const get_list_detail_admin = async (req, res) => {
    const user_id = req.body.user_id
    const req_status=req.query.status
    const req_sort=req.query.sort
    try {
        let type_sort
        if (req_sort!=-1)
            {type_sort=1}
        else
        {
            type_sort=parseInt(req_sort)
        }
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        let order_list
        if (req_status==0)
        {
             order_list = await Order.find({ user_id: user_id }).sort({"order_date":type_sort});
        }else
        { order_list = await Order.find({ user_id: user_id,status:req_status }).sort({"order_date":type_sort});}
        if (!order_list) {
            return res.json({ success: false, message: "Bạn chưa có đơn hàng nào để xem ", color: "text-red-500" })
        }
        let format_order_list = []
        for (let order of order_list) {
            format_order_list.push({user_id: user_id, Order_id: order.Order_id, status: order.status, order_date: date.format(order.order_date,"DD/MM/YYYY"), price_pay: order.price_pay })
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
        const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        if (!order_detail) {
            return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        const formatted_order_detail ={
            _id:order_detail._id,
            Order_id:order_detail.Order_id,
            user_id:order_detail.user_id,
            items:order_detail.items,
            total_price:order_detail.total_price,
            address:order_detail.address,
            phone: order_detail.phone,
            name: order_detail.name,
            shipping_code:order_detail.shipping_code,
            price_pay:order_detail.total_price+order_detail.shipping_code,
            type_pay:order_detail.type_pay,
            status:order_detail.status,
            order_date: date.format(order_detail.order_date,"DD/MM/YYYY")
        }
        return res.json({ success: true, formatted_order_detail, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};

const get_full_order_table = async (req, res) => {
    const req_status=req.query.status
    const req_sort=req.query.sort
    try {
        let type_sort
        if (req_sort!=-1)
            {type_sort=1}
        else
        {
            type_sort=parseInt(req_sort)
        }
        let full_Order_table
        if (req_status==0)
        {
            full_Order_table=await Order.find({}).sort({"order_date":type_sort})
        }
        else
        {
            full_Order_table = await Order.find({status:req_status}).sort({"order_date":type_sort})
        }
            
        let formatted_Order_table = []
        for (let order of full_Order_table) {
            formatted_Order_table.push({ user_id: order.user_id, Order_id: order.Order_id, status: order.status, order_date: date.format(order.order_date,"DD/MM/YYYY"), price_pay: order.price_pay })
        }
        return res.json({ success: true, formatted_Order_table, color: "text-green-500" })
    }
    catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
}

const update_status_order = async (req, res) => {
    const user_id = req.body.user_id;
    const Order_id = req.body.Order_id;
    const new_status_order = req.body.new_status_order;
    try {
        if (!Order_id) {
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn cập nhật", color:"text-red-500" })
        }
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để cập nhật hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        const order_detail = await Order.findOne({ user_id: user_id, Order_id: Order_id });
        if (!order_detail) {
            return res.json({ success: false, message: "Không tìm thấy đơn hàng mà bạn muốn xem", color: "text-red-500" })
        }
        let order_history_check = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
        console.log(order_history_check)
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
        order_detail.status = new_status_order
        await order_detail.save()
        if (new_status_order === 4) {
            const transaction = new Transaction({
                order_id: Order_id,
                price_pay: order_detail.price_pay, // Giả sử trường này tồn tại trong order_detail
                create_date: new Date()
            });
            await transaction.save();
        }
        return res.json({ success: true, message: "Cập nhật trạng thái thành công", color: "text-red-500" })


    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });

    }
};
const get_OrderHistory_log_admin = async (req, res) => {
    const user_id = req.body.user_id;
    const Order_id = req.body.Order_id;
    try {
        if (!user_id) {
            return res.json({ success: false, message: "Vui lòng chọn người dùng để xem hóa đơn mua hàng của họ ", color: "text-red-500" })
        }
        if (!Order_id) {
            return res.json({ success: false, message: "Vui lòng chọn hóa đơn mà bạn muốn xem chi tiết", color: "text-red-500" })
        }
        const list_OrderHistory = await OrderHistory.findOne({ user_id: user_id, Order_id: Order_id })
        if (!list_OrderHistory) {
            return res.json({ sucess: false, message: "Bạn đã nhập sai id user, order id hoặc đơn hàng này chưa tồn tại", color: "text-red-500" })
        }
        return res.json({ success: true, log: list_OrderHistory.status_history, color: "text-green-500" })

    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
    }
};


module.exports = {
    add_order,
    get_order_detail,
    get_list_detail_user,
    get_OrderHistory_log,
    handleMomoNotification,
    callback,

    ///for admin///
    get_list_detail_admin,
    get_order_detail_to_admin,
    update_status_order,
    get_full_order_table,
    get_OrderHistory_log_admin
}