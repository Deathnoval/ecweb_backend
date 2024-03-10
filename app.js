const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');


//middleware


require('dotenv/config');
const api = process.env.API_URL;


app.use(bodyParser.json());
app.use(morgan('tiny'));



const Product=require('./models/product');
app.get(`${api}/products`,async(req, res) =>{
    const productList =await Product.find();
    if(!productList)
    {
        res.status(500).json({success:false})
    }
    res.send(productList);
});

app.post(`${api}/products`, (req, res) => {
    const product = new Product({
        name: req.body.name,
        image: req.body.image,
        countInStock: req.body.countInStock
        
    })

    product.save().then((createdProduct => {
        res.status(201).json({success: true,message:"Product created successfully"})
        
    }))
    .catch((err) => {
        res.status(500).json({
            error:err,
            success: false
        })
    });
})


mongoose.connect(process.env.CONNECTION_STRING,{
    useNewUrlParser:true
})
.then(() => {
    console.log('Database connection is ready')
})
.catch((err) => {
    console.log(err);
});

app.listen(3000,()=>{
    console.log('server is running http://localhost:3000');
})