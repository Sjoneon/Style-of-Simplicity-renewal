import api, { ensureApiSuccess } from './api'

function appendIfDefined(formData, key, value) {
  if (value === undefined || value === null || value === '') {
    return
  }
  formData.append(key, value)
}

export async function fetchMainBanners() {
  return ensureApiSuccess(await api.get('/api/v1/banners'))
}

export async function fetchManagedBanners() {
  return ensureApiSuccess(await api.get('/api/v1/banners/manage'))
}

export async function createMainBanner({
  title,
  subtitle,
  targetProductId,
  displayOrder,
  imageFile,
}) {
  const formData = new FormData()
  appendIfDefined(formData, 'title', title)
  appendIfDefined(formData, 'subtitle', subtitle)
  appendIfDefined(formData, 'targetProductId', targetProductId)
  appendIfDefined(formData, 'displayOrder', displayOrder)
  formData.append('image', imageFile)

  return ensureApiSuccess(await api.post('/api/v1/banners', formData))
}

export async function deleteMainBanner(bannerId) {
  return ensureApiSuccess(await api.delete(`/api/v1/banners/${bannerId}`))
}
