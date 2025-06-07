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
    const { name, discount, type, expiredAt, minPrice } = req.body;
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
        minPrice: minPrice || 0,
        expiredAt: expiredAt
    });

    try {
        const voucher = await newVoucher.save();
        res.status(201).json({ success: true, voucher });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

}

const getDetail = async (req, res) => {
    const id = req.query.id;

    try {
        const voucher = await Voucher.findById(id);
        res.status(200).json({ success: true, voucher });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getVouchers = async (req, res) => {
    const type = req.query.type;
    const status = req.query.status;

    try {
        let vouchers;
        if (type && status) {
            vouchers = await Voucher.find({ type, status });
        } else if (type) {
            vouchers = await Voucher.find({ type });
        } else if (status) {
            vouchers = await Voucher.find({ status });
        } else {
            vouchers = await Voucher.find();
        }

        res.status(200).json({ success: true, vouchers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getReleasedVouchers = async (req, res) => {
    const { userId } = req.query;
    try {
        const projection = { _id: 0, code: 1, name: 1 };
        const dicountVouchers = await Voucher.find({ status: voucherStatus.RELEASED, type: 'discount', expiredAt: { $gte: Date.now() }, userId: { $ne: userId } }).select(projection);
        const shippingVouchers = await Voucher.find({ status: voucherStatus.RELEASED, type: 'shipping', expiredAt: { $gte: Date.now() }, userId: { $ne: userId } }).select(projection);
        res.status(200).json({ success: true, dicountVouchers, shippingVouchers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const updateStatus = async (req, res) => {
    const { id, status } = req.body;

    try {
        const voucher = await Voucher.findById(id);
        voucher.status = status;
        await voucher.save();
        res.status(200).json({ success: true, voucher });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const updateVoucher = async (req, res) => {
    const { id, name, discount, type, expiredAt, minPrice } = req.body;

    try {
        const voucher = await Voucher.findById(id);
        if (name) voucher.name = name;
        if (discount) voucher.discount = discount;
        if (type) voucher.type = type;
        if (expiredAt) voucher.expiredAt = expiredAt;
        if (minPrice) voucher.minPrice = minPrice;

        await voucher.save();
        res.status(200).json({ success: true, voucher });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const deleteVoucher = async (req, res) => {
    const { id } = req.body;

    try {
        await Voucher.findByIdAndDelete(id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
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
                continue;
            }

            if (voucher.status !== voucherStatus.RELEASED) {
                continue;
            }
            if (price < voucher.minPrice) {
                continue;
            }

            if (voucher.expiredAt && voucher.expiredAt < Date.now()) {
                res.status(500).json({ success: true, message: voucher?.name + " đã hết hạn" });
            }

            if (voucher.type === 'discount') {
                discountedPrice = calculateDiscountedPrice(price, voucher.discount);
            } else if (voucher.type === 'shipping') {
                discountedShippingFee = calculateDiscountedPrice(shippingFee, voucher.discount);
            }
        }

        res.status(200).json({ success: true, discountedPrice, discountedShippingFee });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    createVoucher,
    getVouchers,
    updateVoucher,
    deleteVoucher,
    getReleasedVouchers,
    updateStatus,
    applyVoucher,
    getDetail,
}
