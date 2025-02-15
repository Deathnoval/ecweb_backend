const express = require('express');
const cookieParser = require("cookie-parser");

const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const { checkInactivity } = require('./controller/middleware'); // Import checkInactivity
const { updateExpiredVouchers } = require('./schedule/voucher');
const schedule = require('node-schedule');

require('dotenv/config');
//const authJwt = require('./helpers/jwt');


// app.use(cors({
//     origin: 'http://localhost:3000', // thay thế bằng URL của frontend chạy local
//     credentials: true, // cho phép gửi cookie
//     optionsSuccessStatus: 200
// }));
app.use(cors());
app.options('*', cors());

//middleware
app.use(cookieParser());

app.use(express.json());
app.use(bodyParser.json());
// app.use(bodyParser.raw({type:'aplication/vnd.custom-type'}));
// app.use(bodyParser.text({type:'text/html'}));


app.use(morgan('tiny'));
//app.use(authJwt());
// Middleware kiểm tra không hoạt động
app.use(checkInactivity());

const authRoutes = require('./routers/auth')
const userRouter = require('./routers/users')
const categoryRouter = require('./routers/category')
const productRouter = require('./routers/products')
const adminRouter = require('./routers/admin')
const cartRouter = require('./routers/cart')
const orderRouter = require('./routers/order')
const voucherRouter = require('./routers/voucher')
const api = process.env.API_URL;


//Routers
app.use(`${api}/auth`, authRoutes)
app.use(`${api}/users`, userRouter)
app.use(`${api}/category`, categoryRouter)
app.use(`${api}/product`, productRouter)
app.use(`${api}/admin`, adminRouter)
app.use(`${api}/cart`, cartRouter)
app.use(`${api}/order`, orderRouter)
app.use(`${api}/voucher`, voucherRouter)

schedule.scheduleJob('1 0 * * *', updateExpiredVouchers);

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true
})
    .then(() => {
        console.log('Database connection is ready')
    })
    .catch((err) => {
        console.log(err);
    });

app.listen(4000, () => {
    console.log('server is running http://localhost:4000');
})