const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export default function resolveImageUrl(imageUrl) {
  if (!imageUrl) {
    return ''
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  if (!API_BASE_URL) {
    return imageUrl
  }

  return imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`
}
