const router = require("express").Router();
const { User, validate } = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { status } = require("express/lib/response");
const { isDeepStrictEqual } = require("util");
//const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
		if (user)
			return res
				.status(409)
				.send({ message: "User with given email already Exist!" });

		//const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = req.body.password//await bcrypt.hashSync(req.body.password, salt);

		user = await new User({ ...req.body, password: hashPassword }).save();

		const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex"),
		}).save();
		//const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
        const url = `http://localhost:3000/verify/${user.id}/verify/${token.token}`;
		await sendEmail(user.email, "Verify Email", url);

		res
			.status(201)
			.send({ message: "An Email sent to your account please verify" });
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.post("/:id/verify/:token/", async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id });
        console.log(req.params.id);
		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});
        console.log(req.params.token);
		if (!token) return res.status(400).send({ message: "Invalid link" });

		await User.findByIdAndUpdate({ _id: user._id}, {verified: true });
		await token.deleteOne();

		res.status(200).send({ message: "Email verified successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
        console.log(error);
	}
});

router.post("/forgot-password/",async function(req, res) {
	try {
		// const { error } = validate(req.body);
		// if (error)
		// 	return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
		if (!user)
			return res.json({ status: 200, message:"Email Chưa được đăng ký",color: 'text-red-500' });
		const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex"),
			
		}).save();
		//const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
		const url = `http://localhost:3000/resetPass/${user.id}/resetPass/${token.token}`;
		await sendEmail(user.email, "Verify Email", url);	
		return res.json({message:"Đã gữi Email Xác thực",color:"text-green-500"});	
	}catch (error) {
		console.log(error);
		return res.status(500).send({ message: "Internal Server Error" });
	}
});
router.post("/:id/resetPass/:token/",async function(req, res) {
	try {
		const id = req.params.id;
		console.log(id);
		const oldUser= await User.findOne({_id: id});
		if(!oldUser) {
			return res.json({status: 200, message:"Không tìm thấy người dùng",color:"text-red-500"});
		}
		const token = await Token.findOne({
			userId: id,
			token: req.params.token,
		});
		const password = req.body.password
		const confirmPassword = req.body.ConfirmPassword
		if(password==confirmPassword)
		{
			await User.updateOne(
				{
					_id:id,
				},
				{
					$set:{
						password:confirmPassword,
					},
				}
			);
			await token.deleteOne();
			return res.json({success:true,message:"Cập Nhập Mật Khẩu thành công",color:"text-green-500"});	
		}
		else
		{
			return res.json({success:false,message:"Mật Khẩu không trùng",color:"text-red-500"});
		}

	}
	catch (err) {
		console.error(err);
		res.json({status: 200,message:"Có Lỗi đã sảy ra",color: "text-red-500"});
	}
});
router.get("/get_info/:token/",async function(req, res) {
	try{
		token = req.params.token;
		if(!token)
		{
			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
		}
		token = await Token.findOne({
			token: req.params.token,
		});
		const id =token.userId;
		const user= await User.findOne({
			_id:id,
		});
		console.log(user);

		if(!user.address) 
			return res.json({success:true,name:user.ho+" "+user.ten,email:user.email});
		else
			return res.json({success:true,name:user.ho+" "+user.ten,email:user.email,address:user.address});
	}
	catch(err){
		console.log(err);
		return res.json({message:err,color:"text-red-500"});
	}
});
router.post("/logOut/:token/",async function(req, res){
	const token = await Token.findOne({token:req.params.token});
	await token.deleteOne();
});
router.post("/get_address/:token/",async function(req, res){
	try{
		token = req.params.token;
		if(!token)
		{
			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
		}
		token = await Token.findOne({
			token: req.params.token,
		});
		const id =token.userId;
		const user= await User.findOne({
			_id:id,
		});
		console.log(user);

		if(!user.address) 
			return res.json({success:true,address:user.address});
		else
			return res.json({success:false,message:"Người dùng chưa co địa chĩ nhận hàng",color:"text-red-500"});
	}
	catch(err){
		console.log(err);
		return res.json({message:err,color:"text-red-500"});
	}
});

router.post("/insert_address/:token/",async function(req, res){
	try{
		token = req.params.token;
		if(!token)
		{
			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
		}
		token = await Token.findOne({
			token: req.params.token,
		});
		const id =token.userId;
		const user= await User.findOne({
			_id:id,
		});
		console.log(user);
		const newAddress =req.body;
		console.log(newAddress);
		user.address.push(newAddress);
		try
			{
				user.save();
				console.log('Address added successfully');
				return res.json({success:true,message:"Thêm thành công",color:"text-green-500"});
		
			}
			catch (err){
				
				console.error(err);
				return res.json({success:false,message:"Thêm không thành công",color:"text-red-500"});
			}
	}
	catch(err)
	{
		console.log(err);
		return res.json({success:false,message:err,color:"text-red-500"});
	}
});

router.post("/delete_address/:token/:Address_id/",async function(req, res){
	try{
		token = req.params.token;
		if(!token){
			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
		}
		token = await Token.findOne({
			token: req.params.token,
		});
		const UserId =token.userId;
		const user= await User.findOne({
			_id:UserId,
		});
		id_address=req.params.Address_id;
		const address = await user.address.deleteOne({
			_id:id_address,
		})
	}
	
	catch (err){
		console.log(err);
		return res.json({success:false,message:err,color:"text-red-500"});
	}

});

router.post("/update_address/:token/:address_id/",async function(req, res){
	try{
		token = req.params.token;
		if(!token){
			return res.json({success:false,message:"Phiên Đăng Nhập Hết Hạn Vui Lòng Đăng Nhập Lại",color:"text-red-500"});
		}
		token = await Token.findOne({
			token: req.params.token,
		});
		const UserId =token.userId;
		const user= await User.findOne({
			_id:UserId,
		});
		id_address=req.params.Address_id;
		const address = await user.address.finOne({
			_id:id_address,
		})
		const updateAddress =req.body;
		address.updateOne(
			{
				name:req.body.name,
				street:req.body.street,
				number:req.body.number,
				isDefault:req.body.isDefault,
			}
		)
	}
	catch (err){
		console.log(err);
		return res.json({success:false,message:err,color:"text-red-500"});
	}

});


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