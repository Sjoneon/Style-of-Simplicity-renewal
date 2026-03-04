import api from './api'

export async function fetchAllInquiries() {
  const response = await api.get('/api/inquiries')
  return Array.isArray(response.data) ? response.data : []
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
