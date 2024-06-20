const { User } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
let accessTokens = [];

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "7d" }

  );
};

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_PRIVATE_KEY,
    { expiresIn: "365d" }
  );
};


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
        const url = `${process.env.BASE_URL}${process.env.API_URL}/users/${user.id}/verify/${token.token}`;
        await sendEmail(user.email, "Verify Email", url);
        res
          .status(201)
          .send({ message: "An Email sent to your account please verify" });
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
        accessTokens = []
        // res.clearCookie("accessTokens");
        const accessToken = generateAccessToken(user)
        // const refreshToken = generateRefreshToken(user)
        accessTokens.push(accessToken)
        res.cookie("accessTokens", accessTokens, {
          httpOnly: false,
          secure: false,
          path: "/",

          expires: new Date(Date.now() + 86400000),
        });
        const { password, ...other } = user._doc;
        return res.json({ success: true, message: "Đăng nhập thành công", id: user.id, isAdmin: user.isAdmin, accessToken, color: "text-green-500" });
      }
    }
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", colo: "text-red-500" });
  }

};
const requestRefreshToken = async (req, res) => {
  //Take refresh token from user
  const refreshToken = req.cookies.refreshToken;
  //Send error if token is not valid
  if (!refreshToken) return res.status(401).json("You're not authenticated");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid");
  }
  jwt.verify(refreshToken, process.env.JWT_PRIVATE_KEY, (err, user) => {
    if (err) {
      console.log(err);
    }
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    //create new access token, refresh token and send to user
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.push(newRefreshToken);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "strict",
    });
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
};
const logOut = async function (req, res) {
  accessTokens = accessTokens.filter((token) => token !== req.cookies.token);
  res.clearCookie("accessTokens");
  res.status(200).json("Logged out successfully!");
  console.log("logout")
};


module.exports = {
  loginUser,
  logOut,
  requestRefreshToken
}