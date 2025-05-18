const Product = require('../models/product');
const Transaction = require('../models/transaction');
const { User } = require('../models/user');


const statistical = async (req, res) => {
    try {
        const totalProduct = await Product.countDocuments();
        console.log(totalProduct);
        const totalTransaction = await Transaction.countDocuments();
        console.log(totalTransaction);
        const totalUser = await User.countDocuments();
        console.log(totalUser);
        const totalRevenue = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$price_pay" }
                },
            },
        ]);
        console.log(totalRevenue);
        res.status(200).json({
            success: true,
            data: {
                totalProduct,
                totalTransaction,
                totalUser,
                totalRevenue: totalRevenue[0].totalRevenue,
            },
            color: 'text-green-500'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi truy xuất dữ liệu",
            color: 'text-red-500'
        });
    }
}

const revenueStatistics = async (req, res) => {
    const { year } = req.query;

    try {
        const revenue = await Transaction.aggregate([
            {
                $project: {
                    price_pay: 1,
                    year: { $year: "$create_date" },
                    month: { $month: "$create_date" },
                },
            },
            {
                $match: {
                    year: Number(year)
                },
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    revenue: { $sum: "$price_pay" }
                }
            }
        ]);
        console.log(revenue);
        let currnetMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        if(Number(year) !== currentYear) {
            currnetMonth = 12;
        }
        const data = [];
        for (let i = 1; i <= currnetMonth; i++) {
            const index = revenue.findIndex(item => item._id.month === i);
            const item = {
                month: `Tháng ${i}`,
                revenue: index !== -1 ? revenue[index].revenue : 0
            }
            data.push(item);
        }
        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi truy xuất dữ liệu",
        });
    }
}


module.exports = {
    statistical,
    revenueStatistics
}


