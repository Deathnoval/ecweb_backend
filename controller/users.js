const router = require("express").Router();
const { User, validate } = require("../models/user");
const Token = require("../models/token");
const Cart=require("../models/cart")
const Blacklist=require("../models/blacklist")
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { status } = require("express/lib/response");
const { isDeepStrictEqual } = require("util");
const bcrypt = require("bcryptjs");
function generateOTP(length) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // Thêm một số ngẫu nhiên từ 0 đến 9
  }
  return otp;
}

async function changeDefaultAddress(userId, addressId) {
  // Kết nối với database MongoDB
  // const connection = await mongoose.connect('mongodb://localhost:27017/yourDatabaseName');

  // // Tìm kiếm model User
  // const User = connection.model('User');

  // Tìm kiếm user với ID được cung cấp
  const user = await User.findById(userId);

  // Kiểm tra xem user có địa chỉ với ID được cung cấp hay không
  const address = user.address.find(
    (addr) => addr._id.toString() === addressId
  );
  if (!address) {
    console.error(
      `User with ID ${userId} does not have an address with ID ${addressId}`
    );
    return;
  }

  // if(user.address.length >1)
  // {
  // await User.updateOne({ _id: userId, 'address._id': addressId }, { $set: { 'address.$.isDefault': true } });

  // Set các địa chỉ khác là false
  await User.updateOne(
    { _id: userId, "address._id": addressId },
    { $set: { "address.$.isDefault": true } }
  );
  await User.updateOne(
    { _id: userId, "address._id": { $ne: addressId } },
    { $set: { "address.$.isDefault": false } }
  );
  console.log(user);
  // Ngắt kết nối với database MongoDB

  // }

  // await connection.disconnect();
}

const userRegister = async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.json({
        success: false,
        message: error.details[0].message,
        color: "text-red-500",
      });

    let user = await User.findOne({ email: req.body.email });

    if (user) {
      // Check if the user is already verified
      if (user.isVerified) {
        return res.json({
          success: false,
          message: "User with given email is already verified!",
          color: "text-red-500",
        });
      } else {
        // User exists but is not verified, so resend OTP
        const token = await Token.findOne({ userId: user._id });
        if (token) {
          // Generate new OTP and update the existing token
          token.token = generateOTP(6); // Update with new OTP
          await token.save();

          const url = token.token; //`${process.env.BASE_URL}${process.env.API_URL}/users/${user._id}/verify/${token.token}`;
          await sendEmail(user.email, "Resend OTP", url);

          return res.json({
            success: true,
            message: "A new OTP has been sent to your email account.",
            color: "text-green-500",
          });
        } else {
          // If no token exists, create a new one
          const newToken = await new Token({
            userId: user._id,
            token: generateOTP(6),
          }).save();

          const url = newToken.token; //`${process.env.BASE_URL}${process.env.API_URL}/users/${user._id}/verify/${newToken.token}`;
          await sendEmail(user.email, "Resend OTP", url);

          return res.json({
            success: true,
            message: "A new OTP has been sent to your email account.",
            color: "text-green-500",
          });
        }
      }
    }

    // If user does not exist, proceed with the registration process
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    user = await new User({ ...req.body, password: hashPassword }).save();

    const token = await new Token({
      userId: user._id,
      token: generateOTP(6),
    }).save();

    const url = token.token; //`${process.env.BASE_URL}${process.env.API_URL}/users/${user._id}/verify/${token.token}`;
    await sendEmail(user.email, "Verify Email", url);

    return res.json({
      success: true,
      user_id: user._id,
      message: "An email has been sent to your account. Please verify it.",
      color: "text-green-500",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "An error occurred while processing your request.",
      color: "text-red-500",
    });
  }
};

const verifiedEmail_otp = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    console.log(req.params.id);
    if (!user)
      return res.json({
        success: false,
        message: "Invalid link",
        color: "text-red-500",
      });

    const token = await Token.findOne({
      userId: user._id,
      token: req.body.token,
    });
    console.log(req.params.token);
    if (!token)
      return res.json({
        success: false,
        message: "Sai mã otp",
        color: "text-red-500",
      });

    await User.findByIdAndUpdate({ _id: user._id }, { verified: true });
    await token.deleteOne();

    res.json({
      success: true,
      message: "Email verified successfully",
      color: "text-green-500",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
    console.log(error);
  }
};
const forgot_pass_otp = async function (req, res) {
  try {
    // Uncomment and implement validation if necessary
    // const { error } = validate(req.body);
    // if (error)
    // 	return res.status(400).send({ message: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({
        success: false,
        message: "Email chưa được đăng ký",
        color: "text-red-500",
      });
    }
    let token = await Token.findOne({ userId: user._id });
	let url
    if (!token) {
      // Generate OTP and save token
      let newtoken = await new Token({
        userId: user._id,
        token: generateOTP(6), // Ensure this is secure
        verified_Email_otp: false,
        password_is_change: false,
        createdAt: Date.now(), // Optionally add a timestamp
        expiresAt: Date.now() + 5 * 60 * 1000, // Optional expiration of 15 mins
      }).save();
	  url= token;
    } 
	else{
		url=token.token
	}
      
    

    await sendEmail(user.email, "OTP to reset password", url);

    return res.json({
      success: true,
      user_id: user._id,
      message: "Đã gửi Email xác thực",
      color: "text-green-500",
    });
  } catch (error) {
    // Log error in a more robust way if necessary
    console.log(error);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const verify_otp_reset_password = async function (req, res) {
  try {
    const { otp } = req.body;
    const { id } = req.params;
    // Find the token by userId and OTP
    const token = await Token.findOne({ userId: id, token: otp });

    if (!token) {
      return res.json({
        success: false,
        message: "Sai mã OTP",
        color: "text-red-500",
      });
    }

    // Check if the OTP has expired
    if (token.expiresAt < Date.now()) {
      await token.deleteOne(); // Clean up expired token
      return res.json({
        success: false,
        message: "Mã OTP đã hết hạn",
        color: "text-red-500",
      });
    }

    // Mark OTP as verified
    token.verified_Email_otp = true;
    await token.save();

    return res.json({
      success: true,
      message: "OTP đã được xác thực",
      color: "text-green-500",
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const reset_Pass_otp = async function (req, res) {
  try {
    const { id } = req.params;
    const { password, ConfirmPassword } = req.body;

    // Check if the token is verified
    const token = await Token.findOne({ userId: id, verified_Email_otp: true });

    if (!token) {
      return res.json({
        success: false,
        message: "OTP chưa được xác thực",
        color: "text-red-500",
      });
    }

    // Validate that the passwords match
    if (password !== ConfirmPassword) {
      return res.json({
        success: false,
        message: "Mật khẩu không trùng khớp",
        color: "text-red-500",
      });
    }

    // Ensure password meets strength requirements (if any)
    // if (newPassword.length < 8) {
    // 	return res.json({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự", color: "text-red-500" });
    // }
    // Hash the new password

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    // Update user's password in the database
    await User.updateOne(
      { _id: token.userId },
      { $set: { password: hashPassword } }
    );

    // Mark password as changed and delete the token
    token.password_is_change = true;
    await token.deleteOne();

    return res.json({
      success: true,
      message: "Cập nhật mật khẩu thành công",
      color: "text-green-500",
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

// const reset_Pass_otp=async function(req, res) {
// 	try {
// 		const id = req.params.id;
// 		console.log(id);
// 		const oldUser= await User.findOne({_id: id});
// 		if(!oldUser) {
// 			return res.json({success:false, message:"Không tìm thấy người dùng",color:"text-red-500"});
// 		}
// 		const token = await Token.findOne({
// 			userId: id,
// 			token: req.body.token,
// 		});
// 		if(!token) {
// 			return res.json({success:false, message:"Sai đường mã OTP",color:"text-red-500"});
// 		}
// 		const password = req.body.password
// 		const confirmPassword = req.body.ConfirmPassword
// 		if(password==confirmPassword)
// 		{
// 			const salt = await bcrypt.genSalt(Number(process.env.SALT));
// 			const hashPassword = await bcrypt.hashSync(confirmPassword, salt);
// 			await User.updateOne(
// 				{
// 					_id:id,
// 				},
// 				{
// 					$set:{
// 						password:hashPassword,
// 					},
// 				}
// 			);
// 			await token.deleteOne();
// 			return res.json({success:true,message:"Cập Nhập Mật Khẩu thành công",color:"text-green-500"});
// 		}
// 		else
// 		{
// 			return res.json({success:false,message:"Mật Khẩu không trùng",color:"text-red-500"});
// 		}

// 	}
// 	catch (err) {
// 		console.error(err);
// 		res.json({success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500"});
// 	}
// };

const verifiedEmail = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    console.log(req.params.id);
    if (!user)
      return res.json({
        success: false,
        message: "Invalid link",
        color: "text-red-500",
      });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    console.log(req.params.token);
    if (!token) return res.status(400).send({ message: "Invalid link" });

    await User.findByIdAndUpdate({ _id: user._id }, { verified: true });
    await token.deleteOne();

    res.json({
      success: true,
      message: "Email verified successfully",
      color: "text-green-500",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
    console.log(error);
  }
};

const forgot_pass = async function (req, res) {
  try {
    // const { error } = validate(req.body);
    // if (error)
    // 	return res.status(400).send({ message: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.json({
        status: 200,
        message: "Email Chưa được đăng ký",
        color: "text-red-500",
      });
    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}${process.env.API_URL}/users/${user.id}/verify/${token.token}`;
    // const url = `http://localhost:3000/resetPass/${user.id}/resetPass/${token.token}`;
    await sendEmail(user.email, "Verify Email", url);
    return res.json({
      message: "Đã gữi Email Xác thực",
      color: "text-green-500",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};
const reset_Pass = async function (req, res) {
  try {
    const id = req.params.id;
    console.log(id);
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
      return res.json({
        status: 200,
        message: "Không tìm thấy người dùng",
        color: "text-red-500",
      });
    }
    const token = await Token.findOne({
      userId: id,
      token: req.params.token,
    });
    if (!token) {
      return res.json({
        status: 200,
        message: "Sai đường dẫn",
        color: "text-red-500",
      });
    }
    const password = req.body.password;
    const confirmPassword = req.body.ConfirmPassword;
    if (password == confirmPassword) {
      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashPassword = await bcrypt.hashSync(confirmPassword, salt);
      await User.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            password: hashPassword,
          },
        }
      );
      await token.deleteOne();
      return res.json({
        success: true,
        message: "Cập Nhập Mật Khẩu thành công",
        color: "text-green-500",
      });
    } else {
      return res.json({
        success: false,
        message: "Mật Khẩu không trùng",
        color: "text-red-500",
      });
    }
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const get_info = async function (req, res) {
  try {
    const id = req.user.id;
    const user = await User.findOne({
      _id: id,
    });
    console.log(user);

    return res.json({
      success: true,
      name: user.ho + " " + user.ten,
      email: user.email,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const get_address = async function (req, res) {
  try {
    const id = req.user.id;
    const user = await User.findOne({
      _id: id,
    });
    //console.log(user);
    console.log(user.address);

    if (user.address) return res.json(user.address);
    else return res.json([]);
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const insert_address = async function (req, res) {
  try {
    const id = req.user.id;
    const user = await User.findOne({
      _id: id,
    });
    console.log(user);
    const newAddress = req.body;
    if (req.body.isDefault == true) {
      for (const address of user.address) {
        // if (address._id.toString() !== addressId) {
        // 	console.log(address)
        address.isDefault = false;
      }
      await user.save();
    }

    console.log(newAddress);
    user.address.push(newAddress);
    try {
      user.save();

      console.log("Address added successfully");
      return res.json({
        success: true,
        message: "Thêm thành công",
        color: "text-green-500",
      });
    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Thêm không thành công",
        color: "text-red-500",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const delete_address = async function (req, res) {
  try {
    const UserId = req.user.id;
    const user = await User.findOne({
      _id: UserId,
    });
    id_address = req.params.Address_id;
    try {
      const address = user.address.id(id_address);
      if (address == null) {
        return res.json({
          success: false,
          message: "Địa chỉ không tồn tại",
          color: "text-red-500",
        });
      }
      console.log(address);
      await address.deleteOne();
      user
        .save()
        .then(
          res.json({
            success: true,
            message: "Địa chỉ đã xóa thành công",
            color: "text-red-500",
          })
        );
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};

const update_address = async function (req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
        color: "text-red-500",
      });
    }

    const addressId = req.params.address_id;

    const updateAddress = {
      name: req.body.name,
      street: req.body.street,
      provinceID: req.body.provinceID,
      provinceName: req.body.provinceName,
      districtID: req.body.districtID,
      districtName: req.body.districtName,
      wardCode: req.body.wardCode,
      wardName: req.body.wardName,
      number: req.body.number,
      isDefault: req.body.isDefault,
    };

    try {
      if (req.body.isDefault == true) {
        for (const address of user.address) {
          if (address._id.toString() !== addressId) {
            console.log(address);
            address.isDefault = false;
          }
        }
        await user.save();
      }

      // Update the address using the User model's updateOne method
      await User.updateOne(
        { _id: userId, "address._id": addressId }, // Filter to find the specific address
        { $set: { "address.$": updateAddress } }
        // Update the matching address within the array
      );
      //   await user.save();

      res.json({
        success: true,
        message: "Địa chỉ đã cập nhật thành công",
        color: "text-green-500",
      });
    } catch (error) {
      console.error(error);
      return res.json({
        success: false,
        message: "Lỗi cập nhật địa chỉ ",
        color: "text-red-500",
      });
    }
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const grantAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.json({
        success: false,
        message: "Không tìm thấy user",
        color: "text-red-500",
      });
    }

    // Check if the user is already an admin
    if (user.isAdmin) {
      return res.json({
        success: false,
        message: "User này đã có quyền admin",
        color: "text-red-500",
      });
    }

    // Check if the user is verified
    if (!user.verified) {
      return res.json({
        success: false,
        message: "User này chưa xác thực tài khoản",
        color: "text-red-500",
      });
    }

    // If user is not an admin and is verified, grant admin rights
    user.isAdmin = true;
    await user.save();

    return res.json({
      success: true,
      message: `Quyền admin đã được cập cho tài khoản ${user.email}`,
      color: "text-green-500",
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const findUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ _id: userId }).select("-password");

    if (!user) {
      return res.json({
        success: false,
        message: "Không tìm thấy người dùng",
        color: "text-red-500",
      });
    }

    return res.json({
      success: true,
      user: user, // Return the entire user object
      color: "text-green-500",
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: "Lỗi truy xuất dữ liệu",
      color: "text-red-500",
    });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const query = {}; // Initialize query object

    // If there's an email query parameter, use a regular expression for partial matching
    if (req.query.email) {
      query.email = { $regex: req.query.email, $options: "i" }; // Case-insensitive partial match
    }

    // Find users based on the query and select specific fields
    const users = await User.find(query).select("ho ten email _id"); // Only return ho, ten, email, id

    res.json({ success: true, users, color: "text-green-500" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
  }
};


const deleteUserAndCart = async (req, res) => {
  try {
    const userId = req.body.userId;

    // Delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng cần thiết để xoá",color: "text-red-500" });
    }

    // Delete the associated cart if it exists
    const cart = await Cart.findOneAndDelete({ user_id: userId });
    
    return res.json({
      success: true,
      message:"Xoá tài khoản thành công ",
      color: "text-green-500"
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Lỗi truy xuất dữ liệu",color: "text-red-500" });
  }
};
const addToBlacklist = async (req, res) => {
  try {
    const { email } = req.body;

    // Step 1: Check if the email exists in the User collection
    const user = await User.findOne({ email });

    if (user) {
      // Step 2: If the user exists, directly call deleteUserAndCart
      await User.findByIdAndDelete(user._id);
      await Cart.findOneAndDelete({ user_id: user._id });
      
    }

    // Step 3: Add the email to the blacklist
    const blacklistedEmail = new Blacklist({ email });
    await blacklistedEmail.save();

    return res.json({
      success: true,
      message: `${email} đã được thêm vào blacklist`,
      color: "text-green-500",
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Lỗi truy xuất dữ liệu", color: "text-red-500" });
  }
};




module.exports = {
  userRegister,
  verifiedEmail,
  forgot_pass,
  reset_Pass,
  get_info,
  get_address,
  insert_address,
  delete_address,
  update_address,

  verifiedEmail_otp,
  reset_Pass_otp,
  forgot_pass_otp,
  verify_otp_reset_password,
  grantAdmin,
  findUserById,
  getAllUsers,
  deleteUserAndCart,
  addToBlacklist
};

// const router = require("express").Router();
// const {User,validate}=require('../models/user');
// const Token = require("../models/token");
// const crypto = require("crypto");
// const sendEmail = require("../utils/sendEmail");
// const bcrypt = require("bcrypt");

// router.get(`/`, async (req,res)=> {1
//     const userList = await User.find();

//     if(!userList)
//     {
//         res.status(500).json({success:false})
//     }
//     res.send(userList);
// })

// router.get('/:id', async (req, res)=> {
//     const user=await User.findById(req.params.id).select('-password');

//     if(!user){
//     return res.status(500).json({message:'The user with the given ID was not found'})
//     }
//     res.status(200).send(user);
// })

// router.post('/login', async (req, res)=> {
//     const user=await User.findOne({email: req.body.email})
//     const secret = process.env.secret;

//     if(!user){
//         return res.send({success:false,message:'Người dùng không tồn tại',color: 'text-red-500'});
//     }
//     if(user && bcrypt.compareSync(req.body.password, user.password))
//     {
//         const token=jwt.sign(
//             {
//                 userId: user._id,
//             },
//             secret,
//             {
//                 expiresIn: '1d'
//             }
//         )
//         res.status(200).send({success:true, id: user._id,name: user.ho+' '+user.ten,token: token});
//     }
//     else{
//         res.send({success:false, message:'Sai mật khẩu',color: 'text-red-500'});
//     }
// })

// router.post('/register', async (req, res)=> {
//     let user = new User({
//         ho : req.body.ho,
//         ten:  req.body.ten,
//         gender:  req.body.gender,
//         birthday: req.body.birthday,
//         email:  req.body.email,
//         password:  bcrypt.hashSync(req.body.password,10),
//         isAdmin: req.body.isAdmin,

//     })
//     const checkEmail = await User.findOne({email:req.body.email});
//     console.log(checkEmail)
//     if(checkEmail)
//     {
//         res.send({message: 'Email đã tồn tại',color:'text-red-500'})
//     }
//     else {

//         res.send({message: 'Đã gửi email xác nhận cho bạn',color:'text-green-500'});
//     }
// });

// router.post(`/`, async (req,res)=> {
//     let user = new User({
//         ho : req.body.ho,
//         ten:  req.body.ten,
//         gender:  req.body.gender,
//         birthday: req.body.birthday,
//         email:  req.body.email,
//         password:  bcrypt.hashSync(req.body.password,10),
//         isAdmin: req.body.isAdmin,

//     })
//     user = await user.save();

//     if(!user)
//     return res.status(400).send('the user cannot be found')

//     //res.send({message: 'Đã gửi email xác nhận cho bạn'})
//     res.send(user);
// });

// module.exports = router;
