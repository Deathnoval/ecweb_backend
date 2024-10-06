const jwt = require('jsonwebtoken');

// Xác thực token cơ bản
const verifyToken = async (req, res, next) => {
    const token = req.headers.token;

    if (token) {
        const accessToken = token.toString();
        jwt.verify(accessToken, process.env.JWT_PRIVATE_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Token is invalid", 
                    color: "text-red-500" 
                });
            }
            req.user = user; // Lưu thông tin người dùng vào req.user
            next();
        });
    } else {
        return res.status(401).json({ 
            success: false, 
            message: "You're not authenticate", 
            color: "text-red-500" 
        });
    }
};

// Kiểm tra quyền truy cập dựa trên vai trò
const verifyRole = (requiredRoles) => {
    return (req, res, next) => {
        verifyToken(req, res, () => {
            if (req.user.isAdmin) {
                // Nếu người dùng là admin, cho phép truy cập tất cả các quyền
                return next();
            }

            const userRoles = req.user.role || [];
            const hasRole = requiredRoles.some(role => userRoles.includes(role));

            if (hasRole) {
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền truy cập",
                    color: "text-red-500"
                });
            }
        });
    };
};

// Xác thực nếu người dùng có quyền quản lý theo vai trò cụ thể
const verifyToken_ql_order = verifyRole(['ql_order']);
const verifyToken_ql_user = verifyRole(['ql_user']);
const verifyToken_ql_product = verifyRole(['ql_product']);
const verifyToken_ql_transaction = verifyRole(['ql_transaction']);

// Xác thực quyền truy cập của người dùng đến tài khoản của chính họ hoặc quyền admin
const verifyTokenAndUserAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập",
                color: "text-red-500"
            });
        }
    });
};

module.exports = { 
    verifyToken, 
    verifyTokenAdmin: verifyRole(['admin']), // Tạo middleware cho admin
    verifyTokenAndUserAuthorization, 
    verifyToken_ql_order, 
    verifyToken_ql_user, 
    verifyToken_ql_product, 
    verifyToken_ql_transaction 
};
