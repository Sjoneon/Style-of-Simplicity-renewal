import api, { ensureApiSuccess } from './api'

export async function purchaseProduct(productId, optionId) {
  const params = optionId ? { productId, optionId } : { productId }
  return ensureApiSuccess(await api.post('/api/v1/orders/purchase', null, { params }))
}

export async function purchaseCart() {
  return ensureApiSuccess(await api.post('/api/v1/orders/cart/purchase'))
}

export async function fetchMyOrders() {
  return ensureApiSuccess(await api.get('/api/v1/orders/me'))
}

export async function fetchSellerOrders(sellerId) {
  return ensureApiSuccess(await api.get('/api/v1/orders/seller', { params: { sellerId } }))
}

export async function updateOrderStatus(orderId, action) {
  return ensureApiSuccess(await api.put(`/api/v1/orders/${orderId}/${action}`))
}
