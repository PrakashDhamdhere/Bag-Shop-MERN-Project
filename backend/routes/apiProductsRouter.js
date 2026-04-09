const express = require('express');
const router = express.Router();
const productModel = require('../models/product-model');
const isOwnerLogin = require('../middlewares/isOwnerLogin');

function addHashIfNotExists(str) {
    if (!str) return '#000000';
    if (!str.startsWith('#')) {
        return '#' + str;
    }
    return str;
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
        image: product.image ? product.image.toString('base64') : null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

router.get('/', async (req, res) => {
    try {
        const products = await productModel.find();
        res.status(200).json({
            products: products.map(formatProduct),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', isOwnerLogin, async (req, res) => {
    try {
        const { name, description, category, stock, price, discount, bgcolor, panelcolor, textcolor, image } = req.body;

        if (!name || price === undefined || price === null) {
            return res.status(400).json({ message: 'name and price are required' });
        }

        const product = await productModel.create({
            image: image ? Buffer.from(image, 'base64') : undefined,
            name,
            description,
            category,
            stock,
            price,
            discount,
            bgcolor: addHashIfNotExists(bgcolor),
            panelcolor: addHashIfNotExists(panelcolor),
            textcolor: addHashIfNotExists(textcolor),
        });

        res.status(201).json({
            message: 'Product created successfully',
            product: formatProduct(product),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', isOwnerLogin, async (req, res) => {
    try {
        const { name, description, category, stock, price, discount, bgcolor, panelcolor, textcolor, image } = req.body;

        const updateDoc = {
            name,
            description,
            category,
            stock,
            price,
            discount,
            bgcolor: addHashIfNotExists(bgcolor),
            panelcolor: addHashIfNotExists(panelcolor),
            textcolor: addHashIfNotExists(textcolor),
        };

        if (image) {
            updateDoc.image = Buffer.from(image, 'base64');
        }

        const product = await productModel.findByIdAndUpdate(req.params.id, updateDoc, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            message: 'Product updated successfully',
            product: formatProduct(product),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', isOwnerLogin, async (req, res) => {
    try {
        const deletedProduct = await productModel.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            message: 'Product deleted successfully',
            productId: deletedProduct._id,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
