import { http } from "../../../services/http";

export async function ownerLogin(email, password) {
  const response = await http.post("/owners/api/login", { email, password });
  return response.data;
}

export async function ownerLogout() {
  const response = await http.get("/owners/api/logout");
  return response.data;
}

export async function getAdminProducts() {
  const response = await http.get("/owners/api/admin");
  return response.data;
}

export async function getAdminProductById(productId) {
  const response = await http.get(`/owners/api/product/${productId}`);
  return response.data;
}

export async function createProduct(payload) {
  const response = await http.post("/owners/api/create-product", payload);
  return response.data;
}

export async function updateProduct(productId, payload) {
  const response = await http.put(`/owners/api/update-product/${productId}`, payload);
  return response.data;
}

export async function deleteProduct(productId) {
  const response = await http.delete(`/owners/api/delete-product/${productId}`);
  return response.data;
}

export async function setProductPublishState(productId, isPublished) {
  const response = await http.patch(`/owners/api/product/${productId}/publish`, { isPublished });
  return response.data;
}

export async function getAdminOrders() {
  const response = await http.get('/api/orders');
  return response.data;
}

export async function updateOrderStatus(orderId, payload) {
  const response = await http.patch(`/api/orders/${orderId}/status`, payload);
  return response.data;
}
