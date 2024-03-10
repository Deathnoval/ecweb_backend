const {User}=require('../models/user');
const express=require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.get(`/`, async (req,res)=> {
    const userList = await User.find().select('-password');

    if(!userList)
    {
        res.status(500).json({success:false})
    }
    res.send(userList);
})

router.get('/:id', async (req, res)=> {
    const user=await User.findById(req.params.id).select('-password');
    
    if(!user){
    return res.status(500).json({message:'The user with the given ID was not found'})
    }
    res.status(200).send(user);
})
router.post('/register', async (req, res)=> {
    let user = new User({
        ho : req.body.ho,
        ten:  req.body.ten,
        gender:  req.body.gender,
        birthday: req.body.birthday,
        email:  req.body.email,
        password:  bcrypt.hashSync(req.body.password,10),
        isAdmin: req.body.isAdmin,
        
    })
    const checkEmail = await User.findOne({email:req.body.email});
    console.log(checkEmail)
    if(checkEmail)
    {
        res.send({message: 'Email already exists'})
    }
    else {res.send({message: 'Đã gửi email xác nhận cho bạn'});}
});

router.post(`/`, async (req,res)=> {
    let user = new User({
        ho : req.body.ho,
        ten:  req.body.ten,
        gender:  req.body.gender,
        birthday: req.body.birthday,
        email:  req.body.email,
        password:  bcrypt.hashSync(req.body.password,10),
        isAdmin: req.body.isAdmin,
        
    })
    //user = await user.save();

    if(!user)
    return res.status(400).send('the user cannot be found')

    //res.send({message: 'Đã gửi email xác nhận cho bạn'})
    //res.send(user);
});

module.exports = router;