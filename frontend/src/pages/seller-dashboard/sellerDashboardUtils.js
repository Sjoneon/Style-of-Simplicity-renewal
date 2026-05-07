export const CATEGORY_OPTIONS = ['OUTER', 'TOP', 'BOTTOMS', 'SHOES', 'BAG_ACC']

export const FALLBACK_DISCOVERY_TABS = [
  { tabKey: 'starter', label: '처음 시작', displayOrder: 0, active: true },
  { tabKey: 'gift', label: '선물', displayOrder: 1, active: true },
  { tabKey: 'new', label: '신상', displayOrder: 2, active: true },
  { tabKey: 'basic', label: '기본템', displayOrder: 3, active: true },
  { tabKey: 'work', label: '출근 룩', displayOrder: 4, active: true },
]

export const ORDER_ACTIONS = [
  { action: 'process', label: '처리' },
  { action: 'cancel', label: '취소' },
  { action: 'return', label: '반품' },
  { action: 'exchange', label: '교환' },
]

export const ORDER_STATUS_LABELS = {
  ORDERED: '결제완료/배송대기',
  PROCESSED: '배송중(처리)',
  CANCELLED: '취소',
  RETURNED: '반품',
  EXCHANGED: '교환',
}

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ORDERED', label: '결제완료/배송대기' },
  { value: 'PROCESSED', label: '배송중(처리)' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'RETURNED', label: '반품' },
  { value: 'EXCHANGED', label: '교환' },
]

export const EMPTY_DISCOVERY_TAB_FORM = {
  label: '',
  displayOrder: '',
  active: true,
}

export const EMPTY_BANNER_FORM = {
  title: '',
  subtitle: '',
  targetProductId: '',
  displayOrder: '',
  imageFile: null,
}

export const HOME_BANNER_RATIO_TEXT = '4:1'
export const HOME_BANNER_RECOMMENDED_SIZE_TEXT = '2400x600px'
export const HOME_BANNER_MIN_SIZE_TEXT = '1200x300px'

export function sanitizeDiscoveryTabKeys(value) {
  if (!Array.isArray(value)) {
    return []
  }
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
}

export function normalizeManagedDiscoveryTabs(tabs) {
  const source = Array.isArray(tabs) && tabs.length > 0 ? tabs : FALLBACK_DISCOVERY_TABS

  return source
    .map((tab, index) => ({
      id: tab.id ?? null,
      tabKey: String(tab.tabKey || '').trim(),
      label: String(tab.label || '').trim(),
      displayOrder: Number(tab.displayOrder ?? index),
      active: tab.active !== false,
    }))
    .filter((tab) => tab.tabKey && tab.label)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder) || String(a.tabKey).localeCompare(String(b.tabKey)))
}

export function resolveDefaultDiscoveryTabKeys(discoveryTabs) {
  const normalized = normalizeManagedDiscoveryTabs(discoveryTabs)
  const activeTabKeys = normalized
    .filter((tab) => tab.active !== false)
    .map((tab) => tab.tabKey)

  if (activeTabKeys.includes('new')) {
    return ['new']
  }
  if (activeTabKeys.length > 0) {
    return [activeTabKeys[0]]
  }
  return []
}

function getLegacyDiscoveryFlags(categoryValue, priceValue) {
  const normalizedCategory = String(categoryValue || '')
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
  const price = Number(priceValue || 0)

  return {
    showInStarterTab: ['TOP', 'BOTTOMS', 'SHOES', 'OUTER'].includes(normalizedCategory) && price <= 120000,
    showInGiftTab: price >= 60000 && price <= 200000,
    showInNewTab: true,
    showInBasicTab: ['TOP', 'BOTTOMS', 'OUTER'].includes(normalizedCategory),
    showInWorkTab: ['OUTER', 'TOP', 'BOTTOMS', 'SHOES'].includes(normalizedCategory),
  }
}

export function resolveDiscoveryKeys(product) {
  const explicitKeys = sanitizeDiscoveryTabKeys(product?.discoveryTabKeys)
  if (explicitKeys.length > 0) {
    return explicitKeys
  }

  const fallback = getLegacyDiscoveryFlags(product?.category, product?.price)
  const exposure = {
    showInStarterTab: product?.showInStarterTab ?? fallback.showInStarterTab,
    showInGiftTab: product?.showInGiftTab ?? fallback.showInGiftTab,
    showInNewTab: product?.showInNewTab ?? fallback.showInNewTab,
    showInBasicTab: product?.showInBasicTab ?? fallback.showInBasicTab,
    showInWorkTab: product?.showInWorkTab ?? fallback.showInWorkTab,
  }

  return Object.entries(exposure)
    .filter(([, visible]) => Boolean(visible))
    .map(([key]) => {
      if (key === 'showInStarterTab') return 'starter'
      if (key === 'showInGiftTab') return 'gift'
      if (key === 'showInNewTab') return 'new'
      if (key === 'showInBasicTab') return 'basic'
      if (key === 'showInWorkTab') return 'work'
      return null
    })
    .filter(Boolean)
}

export function buildLegacyFlagsFromTabKeys(tabKeys) {
  const keySet = new Set(sanitizeDiscoveryTabKeys(tabKeys))
  return {
    showInStarterTab: keySet.has('starter'),
    showInGiftTab: keySet.has('gift'),
    showInNewTab: keySet.has('new'),
    showInBasicTab: keySet.has('basic'),
    showInWorkTab: keySet.has('work'),
  }
}

export function createEmptyProductForm(discoveryTabs = FALLBACK_DISCOVERY_TABS) {
  const defaultTabKeys = resolveDefaultDiscoveryTabKeys(discoveryTabs)
  return {
    name: '',
    category: 'TOP',
    price: '',
    originalPrice: '',
    quantity: '',
    optionSpecsText: '',
    description: '',
    situationScore: '',
    keywordsText: '',
    ...buildLegacyFlagsFromTabKeys(defaultTabKeys),
    discoveryTabKeys: defaultTabKeys,
    imageFile: null,
    descriptionImageFile: null,
  }
}

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return String(value).replace('T', ' ').slice(0, 16)
}

export function parseKeywordsMap(keywordsText) {
  const list = String(keywordsText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!list.length) {
    return {}
  }

  return {
    manual: [...new Set(list)],
  }
}

export function parseOptionSpecs(optionSpecsText) {
  const raw = String(optionSpecsText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!raw.length) {
    return []
  }

  return raw.map((item, index) => {
    const [sizePart, qtyPart] = item.split(':')
    const sizeLabel = String(sizePart || '').trim().toUpperCase()
    const quantity = Number(String(qtyPart || '').trim())

    if (!sizeLabel) {
      throw new Error('사이즈 값이 비어 있습니다. 예: S:10')
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error(`사이즈 ${sizeLabel}의 재고는 0 이상의 정수여야 합니다.`)
    }

    return {
      sizeLabel,
      quantity,
      displayOrder: index,
    }
  })
}

export function formatOptionSpecs(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return ''
  }
  return options
    .map((option) => `${option.sizeLabel}:${option.quantity}`)
    .join(', ')
}

export function parseOptionalDisplayOrder(rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return undefined
  }
  const parsed = Number(rawValue)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('탭 노출 순서는 0 이상의 정수로 입력해 주세요.')
  }
  return parsed
}
