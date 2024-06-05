const { User } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



const loginUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.json({ success: false, message: "Tài khoản không tồn tại", color: "text-red-500" });
        }
        if (!user.verified) {
            let token = await Token.findOne({ userId: user._id });
            if (!token) {
                token = await new Token({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
                const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
                await sendEmail(user.email, "Verify Email", url);
            }
        }

        else {
            const validPassword = await bcrypt.compare(req.body.password, user.password);
            // console.log(req.body.password);
            // console.log(user.password);
            // console.log(validPassword);
            if (!validPassword) {
                return res.json({ success: false, message: "Sai mật khẩu", color: "text-red-500" });
            }
            else {
                const Token = jwt.sign(
                    {
                        id: user.id,
                        isAdmin: user.isAdmin,
                    },
                    process.env.JWT_PRIVATE_KEY,
                    { expiresIn: "1d" }
                );
                const { password, ...other } = user._doc;
                return res.json({ success: true, message: "Đăng nhập thành công", isAdmin: user.isAdmin, Token, color: "text-green-500" });
            }
        }
    } catch (error) {
        console.error(error);
        return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", colo: "text-red-500" });
    }

};
module.exports = {
    loginUser
}