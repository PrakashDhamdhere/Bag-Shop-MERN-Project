import { http } from "../../../services/http";

export async function getShopProducts() {
  const response = await http.get("/api/shop");
  return response.data;
}

export async function getShopProductById(productId) {
  const response = await http.get(`/api/shop/${productId}`);
  return response.data;
}

export async function addToCart(productId) {
  const response = await http.post("/api/cart/add", { productId });
  return response.data;
}

export async function removeFromCart(productId) {
  const response = await http.post("/api/cart/remove", { productId });
  return response.data;
}

export async function getCart() {
  const response = await http.get("/api/cart");
  return response.data;
}
