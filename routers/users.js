const router = require("express").Router();
const { User, validate } = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { status } = require("express/lib/response");
const { isDeepStrictEqual } = require("util");
const bcrypt = require("bcryptjs");
const userController=require("../controller/users");
const middlewareController = require("../controller/middleware");


async function changeDefaultAddress(userId, addressId) {
	// Kết nối với database MongoDB
	// const connection = await mongoose.connect('mongodb://localhost:27017/yourDatabaseName');
  
	// // Tìm kiếm model User
	// const User = connection.model('User');
  
	// Tìm kiếm user với ID được cung cấp
	const user = await User.findById(userId);
  
	// Kiểm tra xem user có địa chỉ với ID được cung cấp hay không
	const address = user.address.find(addr => addr._id.toString() === addressId);
	if (!address) {
	  console.error(`User with ID ${userId} does not have an address with ID ${addressId}`);
	  return;
	}

	// if(user.address.length >1)
	// {
		// await User.updateOne({ _id: userId, 'address._id': addressId }, { $set: { 'address.$.isDefault': true } });
  
		// Set các địa chỉ khác là false
	await User.updateOne({ _id: userId, 'address._id': addressId }, { $set: { 'address.$.isDefault': true } });
	await User.updateOne({ _id: userId, 'address._id': { $ne: addressId } }, { $set: { 'address.$.isDefault': false } });
	console.log(user)
		// Ngắt kết nối với database MongoDB
		
	// }
	
	

	// await connection.disconnect();
	
  }
router.post("/",userController.userRegister);
// router.post("/:id/verify/:token/",userController.verifiedEmail);
// router.post("/forgot-password/",userController.forgot_pass);
// router.post("/:id/resetPass/:token/",userController.reset_Pass);
router.get("/get_info/",middlewareController.verifyToken,userController.get_info);
router.get("/get_address/",middlewareController.verifyToken,userController.get_address)
router.post("/insert_address/",middlewareController.verifyToken,userController.insert_address)
router.post("/delete_address/:Address_id/",middlewareController.verifyToken,userController.delete_address)
router.post("/update_address/:address_id/",middlewareController.verifyToken,userController.update_address)
router.post("/:id/verify/",userController.verifiedEmail_otp);
router.post("/forgot-password/",userController.forgot_pass_otp);
router.post("/:id/resetPass/",userController.reset_Pass_otp);
router.post("/:id/verify-otp-resetpassword",userController.verify_otp_reset_password)

// router.post("/forgot-password/",async function(req, res) {
// 	try {
// 		// const { error } = validate(req.body);
// 		// if (error)
// 		// 	return res.status(400).send({ message: error.details[0].message });

// 		let user = await User.findOne({ email: req.body.email });
// 		if (!user)
// 			return res.json({ status: 200, message:"Email Chưa được đăng ký",color: 'text-red-500' });
// 		const token = await new Token({
// 			userId: user._id,
// 			token: crypto.randomBytes(32).toString("hex"),
			
// 		}).save();
// 		//const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
// 		const url = `http://localhost:3000/resetPass/${user.id}/resetPass/${token.token}`;
// 		await sendEmail(user.email, "Verify Email", url);	
// 		return res.json({message:"Đã gữi Email Xác thực",color:"text-green-500"});	
// 	}catch (error) {
// 		console.log(error);
// 		return res.status(500).send({ message: "Internal Server Error" });
// 	}
// });
// router.post("/:id/resetPass/:token/",async function(req, res) {
// 	try {
// 		const id = req.params.id;
// 		console.log(id);
// 		const oldUser= await User.findOne({_id: id});
// 		if(!oldUser) {
// 			return res.json({status: 200, message:"Không tìm thấy người dùng",color:"text-red-500"});
// 		}
// 		const token = await Token.findOne({
// 			userId: id,
// 			token: req.params.token,
// 		});
// 		const password = req.body.password
// 		const confirmPassword = req.body.ConfirmPassword
// 		if(password==confirmPassword)
// 		{
// 			await User.updateOne(
// 				{
// 					_id:id,
// 				},
// 				{
// 					$set:{
// 						password:confirmPassword,
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
// 		res.json({status: 200,message:"Có Lỗi đã sảy ra",color: "text-red-500"});
// 	}
// });
// router.get("/get_info/:token/",async function(req, res) {
// 	try{
// 		token = req.params.token;
// 		if(!token)
// 		{
// 			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
// 		}
// 		token = await Token.findOne({
// 			token: req.params.token,
// 		});
// 		const id =token.userId;
// 		const user= await User.findOne({
// 			_id:id,
// 		});
// 		console.log(user);

		
// 		return res.json({success:true,name:user.ho+" "+user.ten,email:user.email});
		
			
// 	}
// 	catch(err){
// 		console.log(err);
// 		return res.json({message:err,color:"text-red-500"});
// 	}
// });

// router.get("/get_address/:id/",async function(req, res){
// 	try{
// 		const id =req.user.id;
// 		const user= await User.findOne({
// 			_id:id,
// 		});
// 		//console.log(user);
// 		console.log(user.address)

// 		if(user.address) 
// 			return res.json(user.address);
// 		else
// 			return res.json([]);
// 	}
// 	catch(err){
// 		console.log(err);
// 		return res.json({message:err,color:"text-red-500"});
// 	}
// });

// router.post("/insert_address/:token/",async function(req, res){
// 	try{
// 		token = req.params.token;
// 		if(!token)
// 		{
// 			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
// 		}
// 		token = await Token.findOne({
// 			token: req.params.token,
// 		});
// 		const id =token.userId;
// 		const user= await User.findOne({
// 			_id:id,
// 		});
// 		console.log(user);
// 		const newAddress =req.body;
// 		if(req.body.isDefault==true)
// 			{
// 				for (const address of user.address) {
// 					// if (address._id.toString() !== addressId) {
// 					// 	console.log(address)
// 					  address.isDefault = false;
// 					}
// 					await user.save();
// 				}
				
			
// 		console.log(newAddress);
// 		user.address.push(newAddress);
// 		try
// 			{
// 				user.save();
				
// 				console.log('Address added successfully');
// 				return res.json({success:true,message:"Thêm thành công",color:"text-green-500"});

		
// 			}
// 			catch (err){
				
// 				console.error(err);
// 				return res.json({success:false,message:"Thêm không thành công",color:"text-red-500"});
// 			}
// 	}
// 	catch(err)
// 	{
// 		console.log(err);
// 		return res.json({success:false,message:err,color:"text-red-500"});
// 	}
// });

// router.post("/delete_address/:id/:Address_id/",async function(req, res){
// 	try{
// 		token = req.params.token;
// 		token = await Token.findOne({
// 			token: req.params.token,
// 		});
// 		if(!token){
// 			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
// 		}
		
// 		const UserId =token.userId;
// 		const user= await User.findOne({
// 			_id:UserId,
// 		});
// 		id_address=req.params.Address_id;
// 		try {
// 			const address = user.address.id(id_address);
// 			if(address==null)
// 			{
// 				return res.json({success: false,message:"Địa chỉ không tồn tại",color:"text-red-500"});
// 			}
// 			console.log(address);
// 			await address.deleteOne();
// 			user.save().then( res.json({success:true,message:"Địa chỉ đã xóa thành công",color:"text-red-500"}));
// 		}
// 		catch (err) {
// 			console.log(err)
// 		}
// 	}
	
// 	catch (err){
// 		console.log(err);
// 		return res.json({success:false,message:err,color:"text-red-500"});
// 	}

// });

// router.post("/update_address/:token/:address_id/",async function(req, res){
// 	try {
// 		const token = req.params.token;
// 		if (!token) {
// 		  return res.json({ success: false, message: "Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại", color: "text-red-500" });
// 		}
	
// 		const tokenData = await Token.findOne({ token: req.params.token });
// 		if (!tokenData) {
// 		  return res.json({ success: false, message: "Invalid Token", color: "text-red-500" });
// 		}
	
// 		const userId = tokenData.userId;
// 		const user = await User.findById(userId);
// 		if (!user) {
// 		  return res.json({ success: false, message: "User not found", color: "text-red-500" });
// 		}
	
// 		const addressId = req.params.address_id;
		
// 		const updateAddress ={
// 			"name": req.body.name,
//             "street": req.body.street,
//             "number": req.body.number,
//             "isDefault": req.body.isDefault
            
// 		} ;
		
// 		try {
// 			if(req.body.isDefault==true)
// 			{
// 				for (const address of user.address) {
// 					if (address._id.toString() !== addressId) {
// 						console.log(address)
// 					  address.isDefault = false;
// 					}
// 				}
// 				await user.save();
// 			}
			
// 		  // Update the address using the User model's updateOne method
// 		  await User.updateOne(
// 			{ _id: userId, "address._id": addressId }, // Filter to find the specific address
// 			{ $set: { "address.$": updateAddress } }
// 			 // Update the matching address within the array
// 		  );
// 		  await user.save();


		  
	
// 		  res.status(200).json({ success: true, message: "Địa chỉ đã cập nhật thành công", color: "text-green-500" });
// 		} catch (error) {
// 		  console.error(error);
// 		  return res.json({ success: false, message: "Error updating address", color: "text-red-500" });
// 		}
// 	  } catch (err) {
// 		console.error(err);
// 		return res.json({ success: false, message: err, color: "text-red-500" });
// 	  }
// 	});


module.exports = router;

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