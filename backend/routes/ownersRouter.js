const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model')
const productModel = require('../models/product-model')
const orderModel = require('../models/order-model')
const generateToken = require('../utils/generateToken');
const isOwnerLogin = require('../middlewares/isOwnerLogin');
const { blacklistToken } = require('../utils/tokenBlacklist');

const ownerCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
}

function addHashIfNotExists(str) {
    if (!str) return "#000000";
    if (!str.startsWith("#")) {
        return "#" + str;
    }
    return str;
}

function toNonNegativeNumber(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.max(0, parsed);
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

if(process.env.NODE_ENV === "development"){
    router.post("/create", async (req, res)=>{
        let owners = await ownerModel.find()
        if(owners.length > 0){
            res.status(503).send("You don't have permssion to create more than one owners")
        } else {
            let {fullname, email, password} = req.body;

            let createdOwner = await ownerModel.create({
                fullname,
                email,
                password,
            })
            res.send(createdOwner)
        }

        
    })
}


router.post("/api/login", async (req, res)=>{
    try {
        const {email, password} = req.body
        const owner = await ownerModel.findOne({email})
        if(!owner || owner.password !== password){
            return res.status(401).json({
                message: "Wrong email and password"
            })
        }

        const token = generateToken(owner)
        res.cookie("token2", token, ownerCookieOptions)
        res.status(200).json({
            message: "Admin login successfull",
            owner: {
                _id: owner._id,
                fullname: owner.fullname,
                email: owner.email,
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get("/api/logout", async (req, res)=>{
    const token = req.cookies?.token2;
    try {
        await blacklistToken(token);
    } catch {
        // If blacklist persistence fails, continue with logout.
    }

    res.cookie("token2","", { ...ownerCookieOptions, maxAge: 0 })
    res.status(200).json({
        message: "Owner logged out successfully"
    })
})

router.get("/api/admin", isOwnerLogin, async (req, res)=>{
    try {
        let products = await productModel.find();
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

router.get('/api/product/:id', isOwnerLogin, async (req, res)=>{
    try {
        const product = await productModel.findById(req.params.id)
        if(!product){
            return res.status(404).json({ message: "Product not found" })
        }

        const salesCountByProduct = await getSalesCountByProduct();
        const salesCount = salesCountByProduct[String(product._id)] || 0;

        res.status(200).json({
            product: formatProduct(product),
            salesCount,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.post("/api/create-product", isOwnerLogin, async (req, res)=>{
    try {
        let {name, description, category, stock, price, discount, bgcolor, panelcolor, textcolor, image} = req.body;

        if (!name || price === undefined || price === null) {
            return res.status(400).json({ message: 'name and price are required' });
        }

        const normalizedPrice = Number(price);
        const parsedDiscount = Number(discount);
        const parsedStock = Number(stock);
        const normalizedDiscount = toNonNegativeNumber(discount, 0);
        const normalizedStock = toNonNegativeNumber(stock, 0);

        if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
            return res.status(400).json({ message: 'price cannot be negative' });
        }

        if (Number.isFinite(parsedDiscount) && parsedDiscount < 0) {
            return res.status(400).json({ message: 'discount cannot be negative' });
        }

        if (Number.isFinite(parsedStock) && parsedStock < 0) {
            return res.status(400).json({ message: 'stock cannot be negative' });
        }

        let product = await productModel.create({
            image: image ? Buffer.from(image, 'base64') : undefined,
            name,
            description,
            category,
            stock: normalizedStock,
            price: normalizedPrice,
            discount: normalizedDiscount,
            bgcolor: addHashIfNotExists(bgcolor),
            panelcolor: addHashIfNotExists(panelcolor),
            textcolor: addHashIfNotExists(textcolor)
        })

        res.status(201).json({
            message: "Product created successfully",
            product: formatProduct(product)
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.put('/api/update-product/:id', isOwnerLogin, async (req, res)=>{
    try {
        let {name, description, category, stock, price, discount, bgcolor, panelcolor, textcolor, image} = req.body;

        const normalizedPrice = Number(price);
        const parsedDiscount = Number(discount);
        const parsedStock = Number(stock);
        const normalizedDiscount = toNonNegativeNumber(discount, 0);
        const normalizedStock = toNonNegativeNumber(stock, 0);

        if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
            return res.status(400).json({ message: 'price cannot be negative' });
        }

        if (Number.isFinite(parsedDiscount) && parsedDiscount < 0) {
            return res.status(400).json({ message: 'discount cannot be negative' });
        }

        if (Number.isFinite(parsedStock) && parsedStock < 0) {
            return res.status(400).json({ message: 'stock cannot be negative' });
        }

        const updateDoc = {
            name,
            description,
            category,
            stock: normalizedStock,
            price: normalizedPrice,
            discount: normalizedDiscount,
            bgcolor: addHashIfNotExists(bgcolor),
            panelcolor: addHashIfNotExists(panelcolor),
            textcolor: addHashIfNotExists(textcolor)
        }

        if(image){
            updateDoc.image = Buffer.from(image, 'base64')
        }

        const product = await productModel.findByIdAndUpdate(
            req.params.id,
            updateDoc,
            { new: true }
        )

        if(!product){
            return res.status(404).json({ message: "Product not found" })
        }

        res.status(200).json({
            message: "Product updated successfully",
            product: formatProduct(product)
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.patch('/api/product/:id/publish', isOwnerLogin, async (req, res) => {
    try {
        const { isPublished } = req.body;
        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({ message: 'isPublished must be boolean' });
        }

        const product = await productModel.findByIdAndUpdate(
            req.params.id,
            { isPublished },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({
            message: isPublished ? 'Product published successfully' : 'Product unpublished successfully',
            product: formatProduct(product),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

router.delete('/api/delete-product/:id', isOwnerLogin, async (req, res)=>{
    try {
        let deletedProduct = await productModel.findOneAndDelete({_id: req.params.id});
        if(!deletedProduct){
            return res.status(404).json({ message: "Product not found" })
        }

        res.status(200).json({
            message: `${deletedProduct.name} deleted`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router