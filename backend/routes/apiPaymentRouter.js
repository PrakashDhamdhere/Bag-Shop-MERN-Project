const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Razorpay = require('razorpay');
const isLoggedIn = require('../middlewares/isLoggedIn');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
router.post('/create-order', isLoggedIn, async (req, res) => {
    try {
        const { amount, currency } = req.body;

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'amount must be greater than 0' });
        }

        const amountInPaisa = Math.round(amount * 100); // Razorpay expects amount in paise

        const options = {
            amount: amountInPaisa,
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(201).json({
            message: 'Payment order created',
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receiptId: order.receipt,
            },
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: error.message || 'Failed to create payment order' });
    }
});

// Verify Razorpay payment
router.post('/verify', isLoggedIn, async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({ message: 'orderId, paymentId and signature are required' });
        }

        // Verify signature
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({
                verified: false,
                message: 'Payment verification failed - Invalid signature',
            });
        }

        // Optionally: Fetch payment details from Razorpay to double-check
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            
            if (payment.status !== 'captured') {
                return res.status(400).json({
                    verified: false,
                    message: 'Payment not captured',
                });
            }
        } catch (err) {
            console.error('Error fetching payment details:', err);
            // Continue with verification if fetch fails
        }

        res.status(200).json({
            verified: true,
            message: 'Payment verified successfully',
            paymentId,
            orderId,
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: error.message || 'Payment verification failed' });
    }
});

module.exports = router;
