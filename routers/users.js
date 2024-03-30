const router = require("express").Router();
const { User, validate } = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
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