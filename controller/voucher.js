const Voucher = require('../models/voucher');
var voucherCode = require('voucher-code-generator');

const voucherStatus = {
    RELEASED: 'released',
    UNRELEASED: 'unreleased',
    EXPIRED: 'expired',
}

const calculateDiscountedPrice = (price, discount) => {
    if (price < 0 || discount < 0 || discount > 100) {
        throw new Error("Giá gốc hoặc phần trăm giảm giá không hợp lệ");
    }

    const discountedPrice = price * ((100 - discount) / 100);
    return discountedPrice;
}

const createVoucher = async (req, res) => {
    const { name, discount, type, expiredAt, minPrice, limit } = req.body;
    const code = voucherCode.generate({
        length: 8,
        count: 1
    })[0];

    const newVoucher = new Voucher({
        name,
        code,
        discount,
        type,
        createdAt: Date.now(),
        limit: limit,
        minPrice: minPrice || 0,
        expiredAt: expiredAt
    });

    try {
        const voucher = await newVoucher.save();
        return res.status(201).json({ success: true, voucher });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

}

const getDetail = async (req, res) => {
    const id = req.query.id;

    try {
        const voucher = await Voucher.findById(id);
        return res.status(200).json({ success: true, voucher });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const getVouchers = async (req, res) => {
    const type = req.query.type;
    const status = req.query.status;

    try {
        // let vouchers;
        // if (type && status) {
        //     vouchers = await Voucher.find({ type, status });
        // } else if (type) {
        //     vouchers = await Voucher.find({ type });
        // } else if (status) {
        //     vouchers = await Voucher.find({ status });
        // } else {
        //     vouchers = await Voucher.find();
        // }

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const vouchers = await Voucher.find(query).sort({ createdAt: -1 }); // 1: tăng dần, gần nhất trước

        return res.status(200).json({ success: true, vouchers });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getReleasedVouchers = async (req, res) => {
    const user_id = req.user.id;
    try {
        const projection = { _id: 0, code: 1, name: 1, expiredAt: 1 };
        const dicountVouchers = await Voucher.find({ status: voucherStatus.RELEASED, type: 'discount', expiredAt: { $gte: Date.now() }, limit: { $gt: 0 }, userId: { $ne: user_id } }).select(projection);
        const shippingVouchers = await Voucher.find({ status: voucherStatus.RELEASED, type: 'shipping', expiredAt: { $gte: Date.now() }, limit: { $gt: 0 }, userId: { $ne: user_id } }).select(projection);
        return res.status(200).json({ success: true, dicountVouchers, shippingVouchers });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const decreaseVoucherLimit = async (req, res) => {
    const { codes } = req.body; // codes là mảng các mã voucher

    try {
        if (!Array.isArray(codes) || codes.length === 0) {
            return res.status(400).json({ success: false, message: "Mã voucher không hợp lệ" });
        }

        await Voucher.updateMany(
            { code: { $in: codes }, limit: { $gt: 0 } },
            { $inc: { limit: -1 } }
        );

        return res.status(200).json({
            success: true,
            message: "Đã giảm limit cho các voucher hợp lệ",
        });

    } catch (error) {
        console.error("decreaseVoucherLimit error:", error);
        return res.status(500).json({ success: false, message: "Có lỗi xảy ra khi giảm limit" });
    }
};

const updateStatus = async (req, res) => {
    const { id, status } = req.body;

    try {
        const voucher = await Voucher.findById(id);
        voucher.status = status;
        await voucher.save();
        return res.status(200).json({ success: true, voucher });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const updateVoucher = async (req, res) => {
    const { id, name, discount, type, expiredAt, minPrice, limit } = req.body;

    try {
        const voucher = await Voucher.findById(id);
        if (name) voucher.name = name;
        if (discount) voucher.discount = discount;
        if (type) voucher.type = type;
        if (expiredAt) voucher.expiredAt = expiredAt;
        if (minPrice) voucher.minPrice = minPrice;
        if (limit !== undefined) voucher.limit = limit;

        await voucher.save();
        return res.status(200).json({ success: true, voucher });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const deleteVoucher = async (req, res) => {
    const { id } = req.body;

    try {
        await Voucher.findByIdAndDelete(id);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const applyVoucher = async (req, res) => {
    const { code, price, shippingFee } = req.body;

    try {
        let discountedPrice = price;
        let discountedShippingFee = shippingFee;

        for (let item of code) {
            const voucher = await Voucher.findOne({ code: item });
            if (!voucher) {
                return res.status(500).json({ success: false, message: "Không tìm thấy voucher" });
            }

            if (voucher.limit <= 0) {
                return res.status(500).json({ success: false, message: `${voucher.name} đã hết lượt sử dụng` });
            }

            if (voucher.status !== voucherStatus.RELEASED) {
                return res.status(500).json({ success: false, message: voucher?.name + " không đủ điều kiện áp dụng" });
            }
            if (price < voucher.minPrice) {
                return res.status(500).json({ success: false, message: voucher?.name + " không đủ điều kiện áp dụng" });
            }

            if (voucher.expiredAt && voucher.expiredAt < Date.now()) {
                return res.status(500).json({ success: false, message: voucher?.name + " đã hết hạn" });
            }

            if (voucher.type === 'discount') {
                discountedPrice = calculateDiscountedPrice(price, voucher.discount);
            } else if (voucher.type === 'shipping') {
                discountedShippingFee = calculateDiscountedPrice(shippingFee, voucher.discount);
            }
        }

        return res.status(200).json({ success: true, discountedPrice, discountedShippingFee });

    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

const updateExpiredVouchers = async () => {
    const vouchers = await Voucher.find({ status: voucherStatus.RELEASED, expiredAt: { $lte: new Date().getTime() } });
    console.log(new Date().getTime());
    console.log(vouchers);
    for (const voucher of vouchers) {
        voucher.status = voucherStatus.EXPIRED;
        await voucher.save();
    }
}

setInterval(updateExpiredVouchers, 600000)

module.exports = {
    createVoucher,
    getVouchers,
    updateVoucher,
    deleteVoucher,
    getReleasedVouchers,
    updateStatus,
    applyVoucher,
    getDetail,
    updateExpiredVouchers,
    decreaseVoucherLimit,
}
