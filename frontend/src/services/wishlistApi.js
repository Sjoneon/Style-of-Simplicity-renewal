import api, { ensureApiSuccess } from './api'

export async function fetchMyWishlist() {
  return ensureApiSuccess(await api.get('/api/v1/wishlist'))
}

export async function fetchWishlistStatus(productId) {
  return ensureApiSuccess(await api.get(`/api/v1/wishlist/${productId}/status`))
}

export async function addToWishlist(productId) {
  return ensureApiSuccess(await api.post(`/api/v1/wishlist/${productId}`))
}

export async function removeFromWishlist(productId) {
  return ensureApiSuccess(await api.delete(`/api/v1/wishlist/${productId}`))
}

export async function toggleWishlist(productId, nextValue) {
  if (nextValue) {
    return addToWishlist(productId)
  }
  return removeFromWishlist(productId)
}
