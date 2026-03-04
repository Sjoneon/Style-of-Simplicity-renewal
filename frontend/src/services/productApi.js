import api, { ensureApiSuccess } from './api'

export async function fetchProducts() {
  return ensureApiSuccess(await api.get('/api/v1/products'))
}

export async function fetchProductById(productId) {
  return ensureApiSuccess(await api.get(`/api/v1/products/${productId}`))
}

export async function fetchCartItems() {
  return ensureApiSuccess(await api.get('/api/v1/products/cart/items'))
}

export async function addProductToCart(productId, optionId) {
  const config = optionId ? { params: { optionId } } : undefined
  return ensureApiSuccess(await api.post(`/api/v1/products/cart/${productId}`, null, config))
}

export async function removeProductFromCart(cartItemId) {
  return ensureApiSuccess(await api.delete(`/api/v1/products/cart/items/${cartItemId}`))
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  return ensureApiSuccess(
    await api.put(`/api/v1/products/cart/items/${cartItemId}/quantity`, null, {
      params: { quantity },
    }),
  )
}

function appendIfDefined(formData, key, value) {
  if (value === undefined || value === null || value === '') {
    return
  }
  formData.append(key, value)
}

export async function createManagedProduct({
  sellerId,
  name,
  category,
  price,
  quantity,
  description,
  situationScore,
  discoveryTabKeys,
  showInStarterTab,
  showInGiftTab,
  showInNewTab,
  showInBasicTab,
  showInWorkTab,
  imageFile,
  descriptionImageFile,
  keywords,
  options,
}) {
  const formData = new FormData()
  formData.append('sellerId', String(sellerId))
  formData.append('name', name)
  formData.append('category', category)
  formData.append('price', String(price))
  formData.append('quantity', String(quantity))
  formData.append('description', description || '')
  appendIfDefined(formData, 'situationScore', situationScore)
  appendIfDefined(formData, 'showInStarterTab', showInStarterTab)
  appendIfDefined(formData, 'showInGiftTab', showInGiftTab)
  appendIfDefined(formData, 'showInNewTab', showInNewTab)
  appendIfDefined(formData, 'showInBasicTab', showInBasicTab)
  appendIfDefined(formData, 'showInWorkTab', showInWorkTab)
  formData.append('discoveryTabKeys', JSON.stringify(discoveryTabKeys || []))
  formData.append('image', imageFile)
  appendIfDefined(formData, 'descriptionImage', descriptionImageFile)
  formData.append('keywords', JSON.stringify(keywords || {}))
  formData.append('options', JSON.stringify(options || []))

  return ensureApiSuccess(
    await api.post('/api/v1/products', formData),
  )
}

export async function updateManagedProduct(
  productId,
  {
    name,
    category,
    price,
    quantity,
    description,
    situationScore,
    discoveryTabKeys,
    showInStarterTab,
    showInGiftTab,
    showInNewTab,
    showInBasicTab,
    showInWorkTab,
    imageFile,
    descriptionImageFile,
    options,
  },
) {
  const formData = new FormData()
  appendIfDefined(formData, 'name', name)
  appendIfDefined(formData, 'category', category)
  appendIfDefined(formData, 'price', price)
  appendIfDefined(formData, 'quantity', quantity)
  appendIfDefined(formData, 'description', description)
  appendIfDefined(formData, 'situationScore', situationScore)
  appendIfDefined(formData, 'showInStarterTab', showInStarterTab)
  appendIfDefined(formData, 'showInGiftTab', showInGiftTab)
  appendIfDefined(formData, 'showInNewTab', showInNewTab)
  appendIfDefined(formData, 'showInBasicTab', showInBasicTab)
  appendIfDefined(formData, 'showInWorkTab', showInWorkTab)
  if (discoveryTabKeys !== undefined) {
    formData.append('discoveryTabKeys', JSON.stringify(discoveryTabKeys || []))
  }
  appendIfDefined(formData, 'image', imageFile)
  appendIfDefined(formData, 'descriptionImage', descriptionImageFile)
  if (options !== undefined) {
    formData.append('options', JSON.stringify(options || []))
  }

  return ensureApiSuccess(
    await api.put(`/api/v1/products/${productId}`, formData),
  )
}

export async function deleteManagedProduct(productId) {
  return ensureApiSuccess(await api.delete(`/api/v1/products/${productId}`))
}
