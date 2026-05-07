const TOSS_SDK_SCRIPT_ID = 'toss-payments-sdk-script'
const TOSS_SDK_SCRIPT_SRC = 'https://js.tosspayments.com/v2/standard'

function ensureTossPaymentsScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경이 아닙니다.'))
  }

  if (typeof window.TossPayments === 'function') {
    return Promise.resolve(window.TossPayments)
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TOSS_SDK_SCRIPT_ID)
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.TossPayments), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('토스 SDK를 불러오지 못했습니다.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = TOSS_SDK_SCRIPT_ID
    script.src = TOSS_SDK_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.TossPayments)
    script.onerror = () => reject(new Error('토스 SDK를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
}

export async function openTossPaymentWindow({
  clientKey,
  customerKey,
  amount,
  orderId,
  orderName,
  successUrl,
  failUrl,
  customerEmail,
  customerName,
  paymentMethod,
}) {
  const safeClientKey = String(clientKey || '').trim()
  if (!safeClientKey) {
    throw new Error('토스 테스트 클라이언트 키(VITE_TOSS_CLIENT_KEY)가 설정되지 않았습니다.')
  }

  const TossPayments = await ensureTossPaymentsScript()
  if (typeof TossPayments !== 'function') {
    throw new Error('토스 SDK 초기화에 실패했습니다.')
  }

  const tossPayments = TossPayments(safeClientKey)
  const payment = tossPayments.payment({
    customerKey: String(customerKey || 'guest_user'),
  })

  const normalizedMethod = String(paymentMethod || '').trim().toUpperCase()
  const requestPayload = {
    method: 'CARD',
    amount: {
      currency: 'KRW',
      value: Number(amount || 0),
    },
    orderId: String(orderId || ''),
    orderName: String(orderName || 'SOS 주문'),
    successUrl: String(successUrl || ''),
    failUrl: String(failUrl || ''),
    customerEmail: String(customerEmail || ''),
    customerName: String(customerName || ''),
  }

  if (normalizedMethod === 'TOSSPAY') {
    requestPayload.flowMode = 'DIRECT'
    requestPayload.easyPay = 'TOSSPAY'
  }

  return payment.requestPayment({
    ...requestPayload,
  })
}
