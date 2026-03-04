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
