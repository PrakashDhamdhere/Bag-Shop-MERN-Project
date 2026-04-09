const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    items: {
        type: Array,
        default: [],
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    paymentId: {
        type: String,
        default: '',
    },
    paymentStatus: {
        type: String,
        enum: ['cod_pending', 'paid', 'failed', 'refunded'],
        default: 'cod_pending',
    },
    orderStatus: {
        type: String,
        enum: ['confirmed', 'ready_to_dispatch', 'on_the_way', 'delivered', 'cancelled'],
        default: 'confirmed',
    },
}, { timestamps: true })

module.exports = mongoose.model('order', orderSchema)
