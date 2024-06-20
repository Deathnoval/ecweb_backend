const jwt = require('jsonwebtoken');



const verifyToken = async (req, res, next) => {
    const token = req.header.token;
    // const localStorageToken = localStorage.getItem('token');
    // console.log(localStorageToken)
    // console.log(token)
    if (token) {
        const accessToken = token.toString();
        jwt.verify(accessToken, process.env.JWT_PRIVATE_KEY, (err, user) => {
            if (err) {
                return res.json({ success: false, message: "Token is invalid", color: "text-red-500" });
            }
            req.user = user;
            // console.log(user);
            
            next();
        });
    } else {
        console.log("token check:" + token)
        return res.json({ success: false, message: "You're not authenticated", color: "text-red-500" });
    }
};
const verifyTokenAdmin = async (req, res, next) => {
    verifyToken(req, res, () => {
        // console.log(req.user.isAdmin);
        if (req.user.isAdmin) {
            // res.set('Content-Type', 'application/json');
            // req.header('Content-Type', 'application/json');
            next();
        }
        else {
            res.json({ success: false, message: "Bạn không có quyền truy cập", color: "text-green-500" });
        }
    })
};
const verifyTokenAndUserAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            next();
        } else {
            res.json({ success: false, message: "Bạn không có quyền truy cập", color: "text-green-500" });
        }
    });
};
module.exports = { verifyToken, verifyTokenAdmin, verifyTokenAndUserAuthorization }