const Transaction = require("../models/transaction");
// 1. API lấy tất cả giao dịch
const getAllTransaction = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.status(200).json({
      success: true,
      data: transactions,
      color:'text-green-500'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color:'text-red-500'
    });
  }
};

// 2. API tìm giao dịch theo order_id, user_id hoặc email

const getTransactionWithCondition = async (req, res) => {
  try {
    const { order_id, user_id, email } = req.query;
    const filter = {};

    if (order_id) filter.order_id = order_id;
    if (user_id) filter.user_id = user_id;
    if (email) filter.email = email;

    const transactions = await Transaction.find(filter);
    res.status(200).json({
      success: true,
      data: transactions,
      color:'text-green-500'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color:'text-red-500'
    });
  }
};

// 3. API lấy các giao dịch có price_pay > 0 (tiền vào)
const getTransactionAdd = async (req, res) => {
  try {
    const transactions = await Transaction.find({ price_pay: { $gt: 0 } });
    res.status(200).json({
      success: true,
      data: transactions,
      color:'text-green-500'

    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color:'text-red-500'

    });
  }
};

// 4. API lấy các giao dịch có price_pay < 0 (tiền ra)
const getTransactionMinus = async (req, res) => {
  try {
    const transactions = await Transaction.find({ price_pay: { $lt: 0 } });
    res.status(200).json({
      success: true,
      data: transactions,
      color:'text-green-500'

    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color:'text-red-500'

    });
  }
};

module.exports = {
  getAllTransaction,
  getTransactionWithCondition,
  getTransactionAdd,
  getTransactionMinus,
};
