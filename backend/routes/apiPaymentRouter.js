const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');

router.post('/create-order', isLoggedIn, async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'amount must be greater than 0' });
        }

        const paymentOrder = {
            id: `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            amount,
            currency: currency || 'INR',
            createdAt: new Date().toISOString(),
        };

        res.status(201).json({
            message: 'Payment order created',
            order: paymentOrder,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/verify', isLoggedIn, async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!orderId || !paymentId) {
            return res.status(400).json({ message: 'orderId and paymentId are required' });
        }

        const paymentSecret = process.env.PAYMENT_SECRET;

        if (!paymentSecret) {
            return res.status(200).json({
                verified: true,
                message: 'Payment verified in development mode',
                paymentId,
            });
        }

        if (!signature) {
            return res.status(400).json({ message: 'signature is required' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', paymentSecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({
                verified: false,
                message: 'Payment verification failed',
            });
        }

        res.status(200).json({
            verified: true,
            message: 'Payment verified successfully',
            paymentId,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
