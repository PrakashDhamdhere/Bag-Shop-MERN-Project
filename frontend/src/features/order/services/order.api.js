import { http } from '../../../services/http';

export async function createOrder(payload) {
  const response = await http.post('/api/orders', payload);
  return response.data;
}

export async function getMyOrders() {
  const response = await http.get('/api/orders/my');
  return response.data;
}

export async function cancelMyOrder(orderId) {
  const response = await http.patch(`/api/orders/${orderId}/cancel`);
  return response.data;
}

// Payment API functions
export async function createPaymentOrder(amount, currency = 'INR') {
  const response = await http.post('/api/payment/create-order', {
    amount,
    currency,
  });
  return response.data;
}

export async function verifyPayment(orderId, paymentId, signature) {
  const response = await http.post('/api/payment/verify', {
    orderId,
    paymentId,
    signature,
  });
  return response.data;
}
