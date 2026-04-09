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
