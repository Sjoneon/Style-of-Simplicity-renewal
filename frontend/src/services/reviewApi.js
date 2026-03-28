import api, { ensureApiSuccess } from './api'

// 로그인 세션 기준 내 리뷰 API 호출 모듈
export async function fetchMyReviews() {
  return ensureApiSuccess(await api.get('/api/v1/reviews/me'))
}

export async function createMyReview(payload) {
  return ensureApiSuccess(await api.post('/api/v1/reviews/me', payload))
}
