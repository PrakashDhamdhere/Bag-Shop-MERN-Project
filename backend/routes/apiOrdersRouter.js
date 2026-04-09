const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isOwnerLogin = require('../middlewares/isOwnerLogin');
const orderModel = require('../models/order-model');
const productModel = require('../models/product-model');

router.post('/', isLoggedIn, async (req, res) => {
    try {
        const { items, totalAmount, paymentId, paymentStatus, orderStatus } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'items must be a non-empty array' });
        }

        if (typeof totalAmount !== 'number' || totalAmount <= 0) {
            return res.status(400).json({ message: 'totalAmount must be greater than 0' });
        }

        if (!paymentId) {
            return res.status(400).json({ message: 'paymentId is required' });
        }

        const normalizedItems = items.map((item) => ({
            ...item,
            productId: String(item?.productId || ''),
            quantity: Math.max(1, Number(item?.quantity || 1)),
        }));

        for (const item of normalizedItems) {
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                return res.status(400).json({ message: 'Invalid productId in items' });
            }
        }

        const quantityByProductId = new Map();
        normalizedItems.forEach((item) => {
            const existingQty = quantityByProductId.get(item.productId) || 0;
            quantityByProductId.set(item.productId, existingQty + item.quantity);
        });

        let order;
        const decrementedItems = [];

        try {
            const productIds = Array.from(quantityByProductId.keys());
            const products = await productModel
                .find({ _id: { $in: productIds } })
                .select('_id name stock');

            if (products.length !== productIds.length) {
                throw new Error('One or more products were not found');
            }

            const productById = new Map(
                products.map((product) => [String(product._id), product])
            );

            for (const [productId, requestedQty] of quantityByProductId.entries()) {
                const product = productById.get(productId);
                if (!product) {
                    throw new Error('One or more products were not found');
                }

                if (Number(product.stock || 0) < requestedQty) {
                    throw new Error(`${product.name} is out of stock`);
                }
            }

            for (const [productId, requestedQty] of quantityByProductId.entries()) {
                const updateResult = await productModel.updateOne(
                    { _id: productId, stock: { $gte: requestedQty } },
                    { $inc: { stock: -requestedQty } }
                );

                if (updateResult.modifiedCount === 0) {
                    const product = productById.get(productId);
                    const fallbackName = product?.name || 'Product';
                    throw new Error(`${fallbackName} is out of stock`);
                }

                decrementedItems.push({ productId, requestedQty });
            }

            order = await orderModel.create({
                userId: req.user._id,
                items: normalizedItems,
                totalAmount,
                paymentId,
                paymentStatus: paymentStatus || 'cod_pending',
                orderStatus: orderStatus || 'confirmed',
            });
        } catch (transactionlessError) {
            if (decrementedItems.length > 0) {
                await Promise.all(
                    decrementedItems.map(({ productId, requestedQty }) =>
                        productModel.updateOne(
                            { _id: productId },
                            { $inc: { stock: requestedQty } }
                        )
                    )
                );
            }

            throw transactionlessError;
        }

        res.status(201).json({
            message: 'Order created successfully',
            order,
        });
    } catch (error) {
        const statusCode = /out of stock|not found|invalid productid/i.test(error.message) ? 400 : 500;
        res.status(statusCode).json({ message: error.message });
    }
});

router.get('/my', isLoggedIn, async (req, res) => {
    try {
        const orders = await orderModel
            .find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id/cancel', isLoggedIn, async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (String(order.userId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You can cancel only your own orders' });
        }

        const cancellableStatuses = ['confirmed', 'ready_to_dispatch'];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                message: 'This order can no longer be cancelled',
            });
        }

        order.orderStatus = 'cancelled';
        if (order.paymentStatus === 'paid') {
            order.paymentStatus = 'refunded';
        }

        await order.save();

        return res.status(200).json({
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.get('/', isOwnerLogin, async (req, res) => {
    try {
        const orders = await orderModel
            .find()
            .populate('userId', 'fullname email address city state pincode country contact')
            .sort({ createdAt: -1 });

        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id/status', isOwnerLogin, async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const allowedOrderStatuses = ['confirmed', 'ready_to_dispatch', 'on_the_way', 'delivered', 'cancelled'];

        const order = await orderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({
                message: 'Cancelled orders cannot be modified',
            });
        }

        if (orderStatus !== undefined) {
            if (!allowedOrderStatuses.includes(orderStatus)) {
                return res.status(400).json({ message: 'Invalid orderStatus value' });
            }
            order.orderStatus = orderStatus;
        }

        await order.save();

        const populatedOrder = await orderModel
            .findById(order._id)
            .populate('userId', 'fullname email address city state pincode country contact');

        return res.status(200).json({
            message: 'Order updated successfully',
            order: populatedOrder,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;
