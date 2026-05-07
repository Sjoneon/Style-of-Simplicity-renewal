const CHECKOUT_PREFIX = 'sosos:checkout:pending:'

export function savePendingCheckout(orderId, payload) {
  if (!orderId) {
    return
  }
  const wrapped = {
    ...payload,
    savedAt: Date.now(),
  }
  sessionStorage.setItem(`${CHECKOUT_PREFIX}${orderId}`, JSON.stringify(wrapped))
}

export function readPendingCheckout(orderId) {
  if (!orderId) {
    return null
  }

  const raw = sessionStorage.getItem(`${CHECKOUT_PREFIX}${orderId}`)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function removePendingCheckout(orderId) {
  if (!orderId) {
    return
  }
  sessionStorage.removeItem(`${CHECKOUT_PREFIX}${orderId}`)
}

export function buildCheckoutOrderId() {
  const random = Math.random().toString(36).slice(2, 10)
  return `SOS_${Date.now()}_${random}`
}
