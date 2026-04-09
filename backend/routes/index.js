const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn')
const productModel = require('../models/product-model')
const userModel = require('../models/user-model')
const orderModel = require('../models/order-model')

function getDiscountedPrice(price, discount) {
    const basePrice = Number(price || 0);
    const discountPercent = Number(discount || 0);

    if (!discountPercent || discountPercent <= 0) {
        return Math.floor(basePrice);
    }

    const discounted = basePrice - ((basePrice * discountPercent) / 100);
    return Math.max(0, Math.floor(discounted));
}

function formatProduct(product) {
    return {
        _id: product._id,
        name: product.name,
        description: product.description,
        category: product.category,
        stock: product.stock,
        price: product.price,
        discount: product.discount,
        bgcolor: product.bgcolor,
        panelcolor: product.panelcolor,
        textcolor: product.textcolor,
        isPublished: Boolean(product.isPublished),
        image: product.image ? product.image.toString('base64') : null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    }
}

async function getSalesCountByProduct() {
    const orders = await orderModel
        .find({ orderStatus: { $ne: 'cancelled' } })
        .select('items')
        .lean();

    return orders.reduce((acc, order) => {
        (order.items || []).forEach((item) => {
            const productId = item?.productId ? String(item.productId) : '';
            if (!productId) return;
            acc[productId] = (acc[productId] || 0) + Number(item?.quantity || 0);
        });
        return acc;
    }, {});
}

router.get("/", (req, res)=>{
    res.status(200).json({
        status: "ok",
        message: "Bag Shop API is running",
    });
});

router.get("/api/shop", isLoggedIn, async (req, res)=>{
    try {
        let products = await productModel.find({ isPublished: true });
        const salesCountByProduct = await getSalesCountByProduct();

        res.status(200).json({
            products: products.map((product) => ({
                ...formatProduct(product),
                salesCount: salesCountByProduct[String(product._id)] || 0,
            }))
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get("/api/shop/:productId", isLoggedIn, async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await productModel.findOne({ _id: productId, isPublished: true });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            product: formatProduct(product),
        });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post("/api/cart/add", isLoggedIn, async (req, res)=>{
    try {
        const { productId } = req.body;
        if(!productId){
            return res.status(400).json({ message: "productId is required" })
        }

        const product = await productModel.findOne({ _id: productId, isPublished: true }).select('_id name stock')
        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        const stockValue = Number(product.stock || 0)
        if (stockValue <= 0) {
            return res.status(400).json({ message: 'Product is out of stock' })
        }

        let user = await userModel.findOne({email: req.user.email})
        const existingQty = (user.cart || []).reduce((acc, cartProductId) => {
            return String(cartProductId) === String(productId) ? acc + 1 : acc
        }, 0)

        if (existingQty >= stockValue) {
            return res.status(400).json({
                message: `Only ${stockValue} item${stockValue > 1 ? 's are' : ' is'} available in stock`,
            })
        }

        user.cart.push(productId)
        await user.save()

        res.status(200).json({ message: "Product added to cart" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post("/api/cart/remove", isLoggedIn, async (req, res)=>{
    try {
        const { productId } = req.body;
        if(!productId){
            return res.status(400).json({ message: "productId is required" })
        }

        let user = await userModel.findOne({email: req.user.email})
        const productIndex = user.cart.indexOf(productId)
        if(productIndex !== -1){
            user.cart.splice(productIndex, 1)
            await user.save()
        }

        res.status(200).json({ message: "Product removed from cart" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get("/api/cart", isLoggedIn, async (req, res)=>{
    try {
        let user = await userModel
        .findOne({email: req.user.email})
        .populate("cart");

        let totalMRP = 0;
        user.cart.forEach((val)=>{
            totalMRP = totalMRP + getDiscountedPrice(val.price, val.discount);
        })

        res.status(200).json({
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                cart: user.cart.map(formatProduct),
            },
            totalMRP,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;