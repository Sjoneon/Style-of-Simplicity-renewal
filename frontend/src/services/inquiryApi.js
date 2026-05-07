import api from './api'

export const INQUIRY_CATEGORY_OPTIONS = [
  { value: 'SHIPPING', label: '배송' },
  { value: 'ORDER_PAYMENT', label: '주문/결제' },
  { value: 'CANCEL_EXCHANGE_REFUND', label: '교환/환불' },
  { value: 'ACCOUNT_INFO', label: '회원정보' },
  { value: 'PRODUCT_CHECK', label: '상품확인' },
  { value: 'SERVICE', label: '서비스' },
  { value: 'SITE_USAGE', label: '사용 문의' },
]

export const DEFAULT_INQUIRY_CATEGORY = 'SERVICE'

const CATEGORY_LABEL_MAP = INQUIRY_CATEGORY_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export function normalizeInquiryCategory(value) {
  const normalized = String(value || '').trim().toUpperCase()
  return CATEGORY_LABEL_MAP[normalized] ? normalized : DEFAULT_INQUIRY_CATEGORY
}

export function getInquiryCategoryLabel(value) {
  const normalized = normalizeInquiryCategory(value)
  return CATEGORY_LABEL_MAP[normalized] || '서비스'
}

export async function fetchAllInquiries() {
  const response = await api.get('/api/inquiries')
  return Array.isArray(response.data) ? response.data : []
}

export async function fetchMyInquiries() {
  const response = await api.get('/api/inquiries/user')
  return Array.isArray(response.data) ? response.data : []
}

export async function createInquiry(payload) {
  const formData = new FormData()
  formData.append('title', String(payload?.title || ''))
  formData.append('content', String(payload?.content || ''))
  formData.append('category', normalizeInquiryCategory(payload?.category))

  if (payload?.productId != null && payload?.productId !== '') {
    formData.append('productId', String(payload.productId))
  }

  if (payload?.imageFile) {
    formData.append('image', payload.imageFile)
  }

  return api.post('/api/inquiries', formData)
}

export async function answerInquiry(inquiryId, answer) {
  return api.put(`/api/inquiries/${inquiryId}/answer`, answer, {
    headers: { 'Content-Type': 'text/plain' },
  })
}

export async function updateInquiryAnswer(inquiryId, answer) {
  return api.put(`/api/inquiries/${inquiryId}/answer/update`, answer, {
    headers: { 'Content-Type': 'text/plain' },
  })
}

export async function deleteInquiry(inquiryId) {
  return api.delete(`/api/inquiries/${inquiryId}`)
}
