import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  withCredentials: true,
})

export function ensureApiSuccess(response) {
  const payload = response?.data
  const isValidPayload = payload && typeof payload.success === 'boolean'

  if (!isValidPayload) {
    throw new Error('API 응답 형식이 올바르지 않습니다.')
  }

  if (!payload.success) {
    throw new Error(payload.message || '요청 처리에 실패했습니다.')
  }

  return payload
}

export function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage ||
    '요청 처리 중 오류가 발생했습니다.'
  )
}

export default api
