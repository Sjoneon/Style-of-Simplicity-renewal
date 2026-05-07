import {
  ALL_CATEGORIES,
  DISCOVERY_FILTER_ALL_TAB,
  FALLBACK_DISCOVERY_TABS,
  RANKING_TAB,
} from './homeConfig'

export function normalizeCategoryKey(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
}

function getLegacyDiscoveryExposure(product) {
  const categoryKey = normalizeCategoryKey(product.category)
  const price = Number(product.price || 0)
  return {
    starter: ['TOP', 'BOTTOMS', 'SHOES', 'OUTER'].includes(categoryKey) && price <= 120000,
    gift: price >= 60000 && price <= 200000,
    new: Number(product.id || 0) >= 1,
    basic: ['TOP', 'BOTTOMS', 'OUTER'].includes(categoryKey),
    work: ['OUTER', 'TOP', 'BOTTOMS', 'SHOES'].includes(categoryKey),
  }
}

export function getProductDiscoveryTabKeys(product) {
  const explicitKeys = Array.isArray(product.discoveryTabKeys)
    ? [...new Set(product.discoveryTabKeys.map((key) => String(key || '').trim()).filter(Boolean))]
    : []

  if (explicitKeys.length > 0) {
    return explicitKeys
  }

  const legacyExposure = getLegacyDiscoveryExposure(product)
  const exposure = {
    starter: product.showInStarterTab ?? legacyExposure.starter,
    gift: product.showInGiftTab ?? legacyExposure.gift,
    new: product.showInNewTab ?? legacyExposure.new,
    basic: product.showInBasicTab ?? legacyExposure.basic,
    work: product.showInWorkTab ?? legacyExposure.work,
  }

  return Object.entries(exposure)
    .filter(([, visible]) => Boolean(visible))
    .map(([tabKey]) => tabKey)
}

function matchesDiscovery(product, tabValue) {
  if (tabValue === DISCOVERY_FILTER_ALL_TAB.tabKey || tabValue === RANKING_TAB.tabKey) {
    return true
  }
  return getProductDiscoveryTabKeys(product).includes(tabValue)
}

function matchesSelectedCategory(product, selectedCategory) {
  if (selectedCategory === ALL_CATEGORIES) {
    return true
  }
  if (selectedCategory === 'BEST') {
    return getProductDiscoveryTabKeys(product).includes('best')
  }
  return normalizeCategoryKey(product.category) === normalizeCategoryKey(selectedCategory)
}

export function filterProducts(products, query, selectedCategory, onlyInStock, discoveryTab) {
  const keyword = String(query || '').trim().toLowerCase()

  return products.filter((product) => {
    const matchesKeyword =
      keyword.length === 0 ||
      product.name?.toLowerCase().includes(keyword) ||
      product.description?.toLowerCase().includes(keyword)

    const matchesCategory = matchesSelectedCategory(product, selectedCategory)
    const matchesStock = !onlyInStock || Number(product.quantity || 0) > 0
    const matchesTab = matchesDiscovery(product, discoveryTab)

    return matchesKeyword && matchesCategory && matchesStock && matchesTab
  })
}

export function sortProducts(products, sortOption, discoveryTab) {
  const list = [...products]

  if (discoveryTab === RANKING_TAB.tabKey) {
    return list.sort((a, b) => {
      const soldCountDiff = Number(b.soldCount || 0) - Number(a.soldCount || 0)
      if (soldCountDiff !== 0) {
        return soldCountDiff
      }
      return Number(b.id || 0) - Number(a.id || 0)
    })
  }

  if (sortOption === 'priceAsc') {
    return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  }
  if (sortOption === 'priceDesc') {
    return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
  }
  if (sortOption === 'name') {
    return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'))
  }

  return list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
}

export function findDefaultDiscoveryTabKey(discoveryTabs) {
  if (!Array.isArray(discoveryTabs) || discoveryTabs.length === 0) {
    return DISCOVERY_FILTER_ALL_TAB.tabKey
  }
  if (discoveryTabs.some((tab) => tab.tabKey === DISCOVERY_FILTER_ALL_TAB.tabKey)) {
    return DISCOVERY_FILTER_ALL_TAB.tabKey
  }
  if (discoveryTabs.some((tab) => tab.tabKey === 'new')) {
    return 'new'
  }
  return discoveryTabs[0].tabKey
}

export function mergeAndNormalizeDiscoveryTabs(discoveryTabs) {
  const baseTabs = Array.isArray(discoveryTabs) && discoveryTabs.length > 0
    ? discoveryTabs
    : FALLBACK_DISCOVERY_TABS

  const normalized = baseTabs
    .map((tab, index) => ({
      tabKey: String(tab.tabKey || tab.value || '').trim(),
      label: String(tab.label || '').trim(),
      displayOrder: Number(tab.displayOrder ?? index),
    }))
    .filter((tab) => tab.tabKey && tab.label)
    .filter((tab) => tab.tabKey !== RANKING_TAB.tabKey && tab.tabKey !== DISCOVERY_FILTER_ALL_TAB.tabKey)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder))

  return [
    { ...DISCOVERY_FILTER_ALL_TAB, displayOrder: -1 },
    ...normalized,
    { ...RANKING_TAB, displayOrder: 9999 },
  ]
}
