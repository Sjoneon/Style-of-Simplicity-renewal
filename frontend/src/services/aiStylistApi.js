import api, { ensureApiSuccess } from './api'

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .map((item) => ({
      role: typeof item?.role === 'string' ? item.role : '',
      text: typeof item?.text === 'string' ? item.text.trim() : '',
    }))
    .filter((item) => ['user', 'assistant'].includes(item.role) && item.text.length > 0)
}

export async function requestAiStyling(message, history = []) {
  return ensureApiSuccess(
    await api.post('/api/v1/ai/stylist/chat', {
      message,
      history: normalizeHistory(history),
    }),
  )
}
