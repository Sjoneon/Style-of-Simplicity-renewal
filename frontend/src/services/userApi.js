import api, { ensureApiSuccess } from './api'

export async function loginUser(payload) {
  return ensureApiSuccess(await api.post('/api/v1/users/login', payload))
}

export async function registerUser(payload) {
  return ensureApiSuccess(await api.post('/api/v1/users/register', payload))
}

export async function fetchCurrentUser() {
  return ensureApiSuccess(await api.get('/api/v1/users/me'))
}

export async function logoutUser() {
  return ensureApiSuccess(await api.post('/api/v1/users/logout'))
}

export async function fetchMyRecentProducts() {
  return ensureApiSuccess(await api.get('/api/v1/users/me/recent-products'))
}

export async function recordRecentProductView(productId) {
  return ensureApiSuccess(await api.post(`/api/v1/users/me/recent-products/${productId}`))
}

export async function updateMyProfile(payload) {
  return ensureApiSuccess(await api.put('/api/v1/users/me/profile', payload))
}

export async function updateMyAddress(payload) {
  return ensureApiSuccess(await api.put('/api/v1/users/me/address', payload))
}

export async function changeMyPassword(payload) {
  return ensureApiSuccess(await api.post('/api/v1/users/me/password', payload))
}
