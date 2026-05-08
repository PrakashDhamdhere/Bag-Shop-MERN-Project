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

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');
const allowedOrigins = String(process.env.ORIGIN || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const normalizedRequestOrigin = normalizeOrigin(origin);
        const isAllowed = allowedOrigins.includes(normalizedRequestOrigin);

        return callback(null, isAllowed);
    },
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