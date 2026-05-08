require('dotenv').config()
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const path = require('path')
const db = require('./config/mongoose-connection')
const ownersRouter = require("./routes/ownersRouter")
const usersRouter = require("./routes/usersRouter")
const index = require("./routes/index")
const apiAuthRouter = require('./routes/apiAuthRouter')
const apiProductsRouter = require('./routes/apiProductsRouter')
const apiOrdersRouter = require('./routes/apiOrdersRouter')
const apiPaymentRouter = require('./routes/apiPaymentRouter')
const cors = require('cors')

app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(cookieParser())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({extended: true, limit: "10mb"}))
app.use(express.static(path.join(__dirname, 'public')))


app.use("/", index)
app.use("/owners", ownersRouter);
app.use("/users", usersRouter);
app.use('/api/auth', apiAuthRouter);
app.use('/api/products', apiProductsRouter);
app.use('/api/orders', apiOrdersRouter);
app.use('/api/payment', apiPaymentRouter);


app.listen(process.env.PORT);