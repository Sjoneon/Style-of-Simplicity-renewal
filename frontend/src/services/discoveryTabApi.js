import api, { ensureApiSuccess } from './api'

export async function fetchDiscoveryTabs() {
  return ensureApiSuccess(await api.get('/api/v1/discovery-tabs'))
}

export async function fetchManagedDiscoveryTabs() {
  return ensureApiSuccess(await api.get('/api/v1/discovery-tabs/manage'))
}

export async function createDiscoveryTab(payload) {
  return ensureApiSuccess(await api.post('/api/v1/discovery-tabs', payload))
}

export async function updateDiscoveryTab(tabId, payload) {
  return ensureApiSuccess(await api.put(`/api/v1/discovery-tabs/${tabId}`, payload))
}

export async function deleteDiscoveryTab(tabId) {
  return ensureApiSuccess(await api.delete(`/api/v1/discovery-tabs/${tabId}`))
}
