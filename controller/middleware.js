const jwt = require('jsonwebtoken');
const blacklist=require('../models/blacklist')
const productController = require('../controller/product'); // Import productController

let lastApiCallTimestamp = Date.now();

async function callGetAllProductList() {
    try {
        // Gọi trực tiếp hàm getProductListALL từ productController
        await productController.getProductListALL({ 
            params: { type_get: 'all', value_sort: '1' } 
        }, { 
            json: (data) => console.log("Dữ liệu nhận được:", data) 
        });
        console.log("Hàm getProductListALL đã được gọi tự động sau 1 tiếng không hoạt động.");
    } catch (error) {
        console.error("Lỗi khi gọi hàm getProductListALL:", error);
    }
}

const checkInactivity = () => (req, res, next) => {
    const currentTime = Date.now();
    const oneHour = 3600000; // 1 tiếng

    if (currentTime - lastApiCallTimestamp >= oneHour) {
        callGetAllProductList();
    }

    lastApiCallTimestamp = currentTime; // Cập nhật thời gian gọi API cuối cùng
    next();
};

// Xác thực token cơ bản
const verifyToken = async (req, res, next) => {
    const token = req.headers.token;

    if (token) {
        const accessToken = token.toString();
        
        jwt.verify(accessToken, process.env.JWT_PRIVATE_KEY, async (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Token is invalid", 
                    color: "text-red-500" 
                });
            }

            try {
                // Check if user is in the blacklist
                const isBlacklisted = await blacklist.findOne({ email: user.email });
                if (isBlacklisted) {
                    return res.status(403).json({ 
                        success: false, 
                        message: "Your account has been banned", 
                        color: "text-red-500" 
                    });
                }
                
                req.user = user; // Store user info in req.user
                next();
            } catch (dbError) {
                return res.status(500).json({ 
                    success: false, 
                    message: "Database error", 
                    color: "text-red-500" 
                });
            }
        });
    } else {
        return res.status(401).json({ 
            success: false, 
            message: "You're not authenticated", 
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
    verifyToken_ql_transaction,
    checkInactivity
};
