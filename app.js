const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors= require('cors');

require('dotenv/config');
const authJwt = require('./helpers/jwt');


app.use(cors());
app.options('*',cors());

//middleware

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());


const productRouter=require('./routers/products')
const userRouter=require('./routers/users')

const api = process.env.API_URL;


//Routers
app.use(`${api}/products`,productRouter)
app.use(`${api}/users`,userRouter)


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