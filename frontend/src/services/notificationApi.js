import api, { ensureApiSuccess } from './api'

export const NOTIFICATION_TYPES = {
  ALL: 'ALL',
  RESTOCK: 'RESTOCK',
  DISCOUNT: 'DISCOUNT',
  ORDER_STATUS: 'ORDER_STATUS',
  INQUIRY_ANSWER: 'INQUIRY_ANSWER',
}

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.RESTOCK]: '재입고',
  [NOTIFICATION_TYPES.DISCOUNT]: '할인',
  [NOTIFICATION_TYPES.ORDER_STATUS]: '주문 상태',
  [NOTIFICATION_TYPES.INQUIRY_ANSWER]: '문의 답변',
}

export async function fetchMyNotifications() {
  return ensureApiSuccess(await api.get('/api/v1/notifications'))
}

export async function fetchMyNotificationSummary() {
  return ensureApiSuccess(await api.get('/api/v1/notifications/summary'))
}

export async function markNotificationAsRead(notificationId) {
  return ensureApiSuccess(await api.put(`/api/v1/notifications/${notificationId}/read`))
}

export async function markAllNotificationsAsRead() {
  return ensureApiSuccess(await api.put('/api/v1/notifications/read-all'))
}
