import api, { ensureApiSuccess } from './api'

export async function confirmTossPayment(payload) {
  return ensureApiSuccess(await api.post('/api/v1/payments/toss/confirm', payload))
}
