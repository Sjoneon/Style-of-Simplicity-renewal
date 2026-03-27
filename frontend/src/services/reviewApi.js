import api, { ensureApiSuccess } from './api'

// 리뷰 API는 모두 로그인 세션(withCredentials) 기준으로 "내 데이터"를 처리한다.
export async function fetchMyReviews() {
  return ensureApiSuccess(await api.get('/api/v1/reviews/me'))
}

export async function createMyReview(payload) {
  return ensureApiSuccess(await api.post('/api/v1/reviews/me', payload))
}
