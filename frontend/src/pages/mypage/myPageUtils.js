import { EMPTY_ADDRESS_FORM, ORDER_STATUS_LABELS } from './myPageConfig'

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return String(value).replace('T', ' ').slice(0, 16)
}

export function formatPrice(value) {
  return Number(value || 0).toLocaleString('ko-KR')
}

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[String(status || '')] || String(status || '상태 미정')
}

function sortByDateDesc(items, key) {
  return [...items].sort((a, b) => String(b?.[key] || '').localeCompare(String(a?.[key] || '')))
}

export function normalizeOrders(rawOrders) {
  if (!Array.isArray(rawOrders)) {
    return []
  }
  return sortByDateDesc(rawOrders, 'orderDate')
}

export function normalizeInquiries(rawInquiries) {
  if (!Array.isArray(rawInquiries)) {
    return []
  }
  return sortByDateDesc(rawInquiries, 'createdDate')
}

export function normalizeWishlist(rawItems) {
  if (!Array.isArray(rawItems)) {
    return []
  }
  return rawItems
}

export function normalizeRecentViewed(rawItems) {
  if (!Array.isArray(rawItems)) {
    return []
  }
  return rawItems
}

export function normalizeReviews(rawReviews) {
  if (!Array.isArray(rawReviews)) {
    return []
  }
  return sortByDateDesc(rawReviews, 'createdDate')
}

export function composeAddressValue(addressForm) {
  const mainAddress = String(addressForm?.address || '').trim()
  const detailAddress = String(addressForm?.detailAddress || '').trim()
  const postcode = String(addressForm?.postcode || '').trim()

  if (!mainAddress) {
    return ''
  }

  const addressWithPostcode = postcode ? `(${postcode}) ${mainAddress}` : mainAddress
  return detailAddress ? `${addressWithPostcode} ${detailAddress}`.trim() : addressWithPostcode
}

export function parseAddressValue(rawAddress) {
  const safeAddress = String(rawAddress || '').trim()
  if (!safeAddress) {
    return { ...EMPTY_ADDRESS_FORM }
  }

  const matched = safeAddress.match(/^\((\d{5})\)\s*(.*)$/)
  if (!matched) {
    return {
      ...EMPTY_ADDRESS_FORM,
      address: safeAddress,
    }
  }

  return {
    ...EMPTY_ADDRESS_FORM,
    postcode: String(matched[1] || '').trim(),
    address: String(matched[2] || '').trim(),
  }
}
