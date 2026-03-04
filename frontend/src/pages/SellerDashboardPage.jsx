import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import {
  createDiscoveryTab,
  deleteDiscoveryTab,
  fetchManagedDiscoveryTabs,
  updateDiscoveryTab,
} from '../services/discoveryTabApi'
import {
  answerInquiry,
  deleteInquiry,
  fetchAllInquiries,
  updateInquiryAnswer,
} from '../services/inquiryApi'
import { fetchSellerOrders, updateOrderStatus } from '../services/orderApi'
import {
  createMainBanner,
  deleteMainBanner,
  fetchManagedBanners,
} from '../services/bannerApi'
import {
  createManagedProduct,
  deleteManagedProduct,
  fetchProducts,
  updateManagedProduct,
} from '../services/productApi'
import resolveImageUrl from '../utils/resolveImageUrl'

const CATEGORY_OPTIONS = ['BEST', 'OUTER', 'TOP', 'BOTTOMS', 'SET CLOTHES', 'SHOES', 'BAG_ACC']

const FALLBACK_DISCOVERY_TABS = [
  { tabKey: 'starter', label: '처음 시작', displayOrder: 0, active: true },
  { tabKey: 'gift', label: '선물', displayOrder: 1, active: true },
  { tabKey: 'new', label: '신상', displayOrder: 2, active: true },
  { tabKey: 'basic', label: '기본템', displayOrder: 3, active: true },
  { tabKey: 'work', label: '출근 룩', displayOrder: 4, active: true },
]

const ORDER_ACTIONS = [
  { action: 'process', label: '처리' },
  { action: 'cancel', label: '취소' },
  { action: 'return', label: '반품' },
  { action: 'exchange', label: '교환' },
]

const ORDER_STATUS_LABELS = {
  ORDERED: '결제완료/배송대기',
  PROCESSED: '배송중(처리)',
  CANCELLED: '취소',
  RETURNED: '반품',
  EXCHANGED: '교환',
}

const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ORDERED', label: '결제완료/배송대기' },
  { value: 'PROCESSED', label: '배송중(처리)' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'RETURNED', label: '반품' },
  { value: 'EXCHANGED', label: '교환' },
]

const EMPTY_DISCOVERY_TAB_FORM = {
  label: '',
  displayOrder: '',
  active: true,
}

function sanitizeDiscoveryTabKeys(value) {
  if (!Array.isArray(value)) {
    return []
  }
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
}

function normalizeManagedDiscoveryTabs(tabs) {
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

function resolveDefaultDiscoveryTabKeys(discoveryTabs) {
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

function resolveDiscoveryKeys(product) {
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

function buildLegacyFlagsFromTabKeys(tabKeys) {
  const keySet = new Set(sanitizeDiscoveryTabKeys(tabKeys))
  return {
    showInStarterTab: keySet.has('starter'),
    showInGiftTab: keySet.has('gift'),
    showInNewTab: keySet.has('new'),
    showInBasicTab: keySet.has('basic'),
    showInWorkTab: keySet.has('work'),
  }
}

function createEmptyProductForm(discoveryTabs = FALLBACK_DISCOVERY_TABS) {
  const defaultTabKeys = resolveDefaultDiscoveryTabKeys(discoveryTabs)
  return {
    name: '',
    category: 'TOP',
    price: '',
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

const EMPTY_BANNER_FORM = {
  title: '',
  subtitle: '',
  targetProductId: '',
  displayOrder: '',
  imageFile: null,
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return String(value).replace('T', ' ').slice(0, 16)
}

function parseKeywordsMap(keywordsText) {
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

function parseOptionSpecs(optionSpecsText) {
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

function formatOptionSpecs(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return ''
  }
  return options
    .map((option) => `${option.sizeLabel}:${option.quantity}`)
    .join(', ')
}

function parseOptionalDisplayOrder(rawValue) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return undefined
  }
  const parsed = Number(rawValue)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('탭 노출 순서는 0 이상의 정수로 입력해 주세요.')
  }
  return parsed
}

function SellerDashboardPage() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')

  const [products, setProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [managedDiscoveryTabs, setManagedDiscoveryTabs] = useState(() => normalizeManagedDiscoveryTabs([]))
  const [discoveryTabDrafts, setDiscoveryTabDrafts] = useState({})
  const [newDiscoveryTabForm, setNewDiscoveryTabForm] = useState(EMPTY_DISCOVERY_TAB_FORM)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [productForm, setProductForm] = useState(() => createEmptyProductForm(FALLBACK_DISCOVERY_TABS))
  const [savingProduct, setSavingProduct] = useState(false)
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER_FORM)
  const [savingBanner, setSavingBanner] = useState(false)
  const [deletingBannerId, setDeletingBannerId] = useState(null)
  const [creatingDiscoveryTab, setCreatingDiscoveryTab] = useState(false)
  const [updatingDiscoveryTabId, setUpdatingDiscoveryTabId] = useState(null)
  const [deletingDiscoveryTabId, setDeletingDiscoveryTabId] = useState(null)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [editProductForm, setEditProductForm] = useState(() => createEmptyProductForm(FALLBACK_DISCOVERY_TABS))
  const [updatingProduct, setUpdatingProduct] = useState(false)

  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [actionLoadingOrderId, setActionLoadingOrderId] = useState(null)

  const [inquiryOnlyPending, setInquiryOnlyPending] = useState(false)
  const [inquiryDrafts, setInquiryDrafts] = useState({})
  const [savingInquiryId, setSavingInquiryId] = useState(null)
  const [deletingInquiryId, setDeletingInquiryId] = useState(null)

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const [productResponse, orderResponse, inquiryList, bannerResponse, discoveryTabResponse] = await Promise.all([
        fetchProducts(),
        fetchSellerOrders(user.id),
        fetchAllInquiries(),
        fetchManagedBanners(),
        fetchManagedDiscoveryTabs().catch(() => ({ data: FALLBACK_DISCOVERY_TABS })),
      ])

      const allProducts = Array.isArray(productResponse.data) ? productResponse.data : []
      const sellerOrders = Array.isArray(orderResponse.data) ? orderResponse.data : []
      const allInquiries = Array.isArray(inquiryList) ? inquiryList : []
      const managedBanners = Array.isArray(bannerResponse.data) ? bannerResponse.data : []
      const discoveryTabs = normalizeManagedDiscoveryTabs(Array.isArray(discoveryTabResponse?.data) ? discoveryTabResponse.data : [])

      setProducts(allProducts)
      setOrders(sellerOrders)
      setInquiries(allInquiries)
      setBanners(managedBanners)
      setManagedDiscoveryTabs(discoveryTabs)
      setDiscoveryTabDrafts(() => {
        const next = {}
        discoveryTabs.forEach((tab) => {
          if (tab.id == null) {
            return
          }
          next[tab.id] = {
            label: tab.label,
            displayOrder: String(tab.displayOrder ?? 0),
            active: tab.active !== false,
          }
        })
        return next
      })
      setInquiryDrafts((prev) => {
        const next = {}
        allInquiries.forEach((inquiry) => {
          next[inquiry.id] = prev[inquiry.id] ?? inquiry.answer ?? ''
        })
        return next
      })
    } catch (err) {
      setError(getApiErrorMessage(err, '슈퍼관리자 대시보드 데이터를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const myProducts = useMemo(() => {
    return products.filter((product) => Number(product.sellerId) === Number(user?.id))
  }, [products, user?.id])

  const assignableDiscoveryTabs = useMemo(() => {
    return managedDiscoveryTabs.filter((tab) => tab.active !== false)
  }, [managedDiscoveryTabs])

  const managedDiscoveryTabKeySet = useMemo(() => {
    return new Set(managedDiscoveryTabs.map((tab) => tab.tabKey))
  }, [managedDiscoveryTabs])

  const visibleOrders = useMemo(() => {
    if (orderStatusFilter === 'ALL') {
      return orders
    }
    return orders.filter((order) => String(order.status) === orderStatusFilter)
  }, [orders, orderStatusFilter])

  const visibleInquiries = useMemo(() => {
    const sorted = [...inquiries].sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')))
    if (!inquiryOnlyPending) {
      return sorted
    }
    return sorted.filter((item) => !String(item.answer || '').trim())
  }, [inquiries, inquiryOnlyPending])

  const totalSalesAmount = useMemo(() => {
    return orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
  }, [orders])

  const todayOrderCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return orders.filter((order) => String(order.orderDate || '').startsWith(today)).length
  }, [orders])

  const shippingPendingCount = useMemo(() => {
    return orders.filter((order) => order.status === 'ORDERED').length
  }, [orders])

  const unansweredInquiryCount = useMemo(() => {
    return inquiries.filter((inquiry) => !String(inquiry.answer || '').trim()).length
  }, [inquiries])

  const orderStatusSummary = useMemo(() => {
    return orders.reduce((acc, order) => {
      const status = String(order.status || 'UNKNOWN')
      acc[status] = Number(acc[status] || 0) + 1
      return acc
    }, {})
  }, [orders])

  const resetCreateForm = useCallback(() => {
    setProductForm(createEmptyProductForm(managedDiscoveryTabs))
  }, [managedDiscoveryTabs])

  const resetBannerForm = () => {
    setBannerForm(EMPTY_BANNER_FORM)
  }

  useEffect(() => {
    setProductForm((prev) => {
      const nextKeys = sanitizeDiscoveryTabKeys(prev.discoveryTabKeys).filter((tabKey) => managedDiscoveryTabKeySet.has(tabKey))
      if (nextKeys.length === sanitizeDiscoveryTabKeys(prev.discoveryTabKeys).length) {
        return prev
      }
      return {
        ...prev,
        discoveryTabKeys: nextKeys,
        ...buildLegacyFlagsFromTabKeys(nextKeys),
      }
    })

    setEditProductForm((prev) => {
      const nextKeys = sanitizeDiscoveryTabKeys(prev.discoveryTabKeys).filter((tabKey) => managedDiscoveryTabKeySet.has(tabKey))
      if (nextKeys.length === sanitizeDiscoveryTabKeys(prev.discoveryTabKeys).length) {
        return prev
      }
      return {
        ...prev,
        discoveryTabKeys: nextKeys,
        ...buildLegacyFlagsFromTabKeys(nextKeys),
      }
    })
  }, [managedDiscoveryTabKeySet])

  const handleToggleCreateProductDiscoveryTab = (tabKey, checked) => {
    setProductForm((prev) => {
      const nextKeySet = new Set(sanitizeDiscoveryTabKeys(prev.discoveryTabKeys))
      if (checked) {
        nextKeySet.add(tabKey)
      } else {
        nextKeySet.delete(tabKey)
      }
      const nextKeys = [...nextKeySet]
      return {
        ...prev,
        discoveryTabKeys: nextKeys,
        ...buildLegacyFlagsFromTabKeys(nextKeys),
      }
    })
  }

  const handleToggleEditProductDiscoveryTab = (tabKey, checked) => {
    setEditProductForm((prev) => {
      const nextKeySet = new Set(sanitizeDiscoveryTabKeys(prev.discoveryTabKeys))
      if (checked) {
        nextKeySet.add(tabKey)
      } else {
        nextKeySet.delete(tabKey)
      }
      const nextKeys = [...nextKeySet]
      return {
        ...prev,
        discoveryTabKeys: nextKeys,
        ...buildLegacyFlagsFromTabKeys(nextKeys),
      }
    })
  }

  const handleCreateDiscoveryTab = async (event) => {
    event.preventDefault()

    const label = String(newDiscoveryTabForm.label || '').trim()
    if (!label) {
      setError('새 탭 이름을 입력해 주세요.')
      return
    }

    let displayOrder
    try {
      displayOrder = parseOptionalDisplayOrder(newDiscoveryTabForm.displayOrder)
    } catch (parseError) {
      setError(parseError.message)
      return
    }

    setCreatingDiscoveryTab(true)
    setError('')
    try {
      await createDiscoveryTab({
        label,
        displayOrder,
        active: newDiscoveryTabForm.active !== false,
      })
      setNewDiscoveryTabForm(EMPTY_DISCOVERY_TAB_FORM)
      await loadDashboard()
      setSuccessMessage('홈 탐색 탭을 추가했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '홈 탐색 탭 추가에 실패했습니다.'))
    } finally {
      setCreatingDiscoveryTab(false)
    }
  }

  const handleSaveDiscoveryTab = async (tabId) => {
    const draft = discoveryTabDrafts[tabId]
    if (!draft) {
      return
    }

    const label = String(draft.label || '').trim()
    if (!label) {
      setError('탭 이름을 입력해 주세요.')
      return
    }

    let displayOrder
    try {
      displayOrder = parseOptionalDisplayOrder(draft.displayOrder)
    } catch (parseError) {
      setError(parseError.message)
      return
    }

    setUpdatingDiscoveryTabId(tabId)
    setError('')
    try {
      await updateDiscoveryTab(tabId, {
        label,
        displayOrder,
        active: draft.active !== false,
      })
      await loadDashboard()
      setSuccessMessage('홈 탐색 탭을 수정했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '홈 탐색 탭 수정에 실패했습니다.'))
    } finally {
      setUpdatingDiscoveryTabId(null)
    }
  }

  const handleDeleteDiscoveryTab = async (tabId) => {
    const confirmed = window.confirm('이 홈 탐색 탭을 삭제하시겠습니까?')
    if (!confirmed) {
      return
    }

    setDeletingDiscoveryTabId(tabId)
    setError('')
    try {
      await deleteDiscoveryTab(tabId)
      await loadDashboard()
      setSuccessMessage('홈 탐색 탭을 삭제했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '홈 탐색 탭 삭제에 실패했습니다.'))
    } finally {
      setDeletingDiscoveryTabId(null)
    }
  }

  const handleCreateBanner = async (event) => {
    event.preventDefault()

    if (!bannerForm.imageFile) {
      setError('메인 배너 등록 시 배너 이미지는 필수입니다.')
      return
    }

    let displayOrderValue
    if (bannerForm.displayOrder !== '') {
      displayOrderValue = Number(bannerForm.displayOrder)
      if (!Number.isInteger(displayOrderValue) || displayOrderValue < 0) {
        setError('노출 순서는 0 이상의 정수로 입력해 주세요.')
        return
      }
    }

    let targetProductIdValue
    if (bannerForm.targetProductId !== '') {
      targetProductIdValue = Number(bannerForm.targetProductId)
      if (!Number.isInteger(targetProductIdValue) || targetProductIdValue <= 0) {
        setError('연결 상품 값을 확인해 주세요.')
        return
      }
    }

    setSavingBanner(true)
    setError('')

    try {
      await createMainBanner({
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        targetProductId: targetProductIdValue,
        displayOrder: displayOrderValue,
        imageFile: bannerForm.imageFile,
      })

      resetBannerForm()
      await loadDashboard()
      setSuccessMessage('메인 광고 배너를 등록했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '메인 광고 배너 등록에 실패했습니다.'))
    } finally {
      setSavingBanner(false)
    }
  }

  const handleDeleteBanner = async (bannerId) => {
    const confirmed = window.confirm('이 배너를 삭제하시겠습니까?')
    if (!confirmed) {
      return
    }

    setDeletingBannerId(bannerId)
    setError('')

    try {
      await deleteMainBanner(bannerId)
      await loadDashboard()
      setSuccessMessage('메인 광고 배너를 삭제했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '메인 광고 배너 삭제에 실패했습니다.'))
    } finally {
      setDeletingBannerId(null)
    }
  }

  const handleCreateProduct = async (event) => {
    event.preventDefault()

    if (!productForm.imageFile) {
      setError('상품 등록 시 대표 이미지는 필수입니다.')
      return
    }

    const price = Number(productForm.price)
    let options
    try {
      options = parseOptionSpecs(productForm.optionSpecsText)
    } catch (parseError) {
      setError(parseError.message)
      return
    }

    if (!options.length) {
      setError('사이즈별 재고를 1개 이상 입력해 주세요. 예: S:10, M:5')
      return
    }

    const quantity = options.reduce((sum, option) => sum + Number(option.quantity || 0), 0)
    const discoveryTabKeys = sanitizeDiscoveryTabKeys(productForm.discoveryTabKeys)
    const legacyDiscoveryFlags = buildLegacyFlagsFromTabKeys(discoveryTabKeys)

    if (!Number.isFinite(price) || price < 0) {
      setError('가격은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    setSavingProduct(true)
    setError('')

    try {
      await createManagedProduct({
        sellerId: user.id,
        name: productForm.name,
        category: productForm.category,
        price,
        quantity,
        description: productForm.description,
        situationScore: productForm.situationScore === '' ? undefined : Number(productForm.situationScore),
        showInStarterTab: legacyDiscoveryFlags.showInStarterTab,
        showInGiftTab: legacyDiscoveryFlags.showInGiftTab,
        showInNewTab: legacyDiscoveryFlags.showInNewTab,
        showInBasicTab: legacyDiscoveryFlags.showInBasicTab,
        showInWorkTab: legacyDiscoveryFlags.showInWorkTab,
        discoveryTabKeys,
        imageFile: productForm.imageFile,
        descriptionImageFile: productForm.descriptionImageFile || undefined,
        keywords: parseKeywordsMap(productForm.keywordsText),
        options,
      })

      resetCreateForm()
      await loadDashboard()
      setSuccessMessage('상품을 등록했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 등록에 실패했습니다.'))
    } finally {
      setSavingProduct(false)
    }
  }

  const openEditProductDialog = (product) => {
    const discoveryTabKeys = resolveDiscoveryKeys(product)
    const discoveryFlags = buildLegacyFlagsFromTabKeys(discoveryTabKeys)
    setEditingProductId(product.id)
    setEditProductForm({
      name: product.name || '',
      category: product.category || 'TOP',
      price: String(product.price ?? ''),
      quantity: String(product.quantity ?? ''),
      optionSpecsText: formatOptionSpecs(product.options),
      description: product.description || '',
      situationScore: product.situationScore ?? '',
      keywordsText: '',
      discoveryTabKeys,
      ...discoveryFlags,
      imageFile: null,
      descriptionImageFile: null,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProductId) {
      return
    }

    const price = Number(editProductForm.price)
    let options
    try {
      options = parseOptionSpecs(editProductForm.optionSpecsText)
    } catch (parseError) {
      setError(parseError.message)
      return
    }

    if (!options.length) {
      setError('사이즈별 재고를 1개 이상 입력해 주세요. 예: S:10, M:5')
      return
    }

    const quantity = options.reduce((sum, option) => sum + Number(option.quantity || 0), 0)
    const discoveryTabKeys = sanitizeDiscoveryTabKeys(editProductForm.discoveryTabKeys)
    const legacyDiscoveryFlags = buildLegacyFlagsFromTabKeys(discoveryTabKeys)

    if (!Number.isFinite(price) || price < 0) {
      setError('가격은 0 이상의 숫자로 입력해 주세요.')
      return
    }

    setUpdatingProduct(true)
    setError('')

    try {
      await updateManagedProduct(editingProductId, {
        name: editProductForm.name,
        category: editProductForm.category,
        price,
        quantity,
        description: editProductForm.description,
        situationScore: editProductForm.situationScore === '' ? undefined : Number(editProductForm.situationScore),
        showInStarterTab: legacyDiscoveryFlags.showInStarterTab,
        showInGiftTab: legacyDiscoveryFlags.showInGiftTab,
        showInNewTab: legacyDiscoveryFlags.showInNewTab,
        showInBasicTab: legacyDiscoveryFlags.showInBasicTab,
        showInWorkTab: legacyDiscoveryFlags.showInWorkTab,
        discoveryTabKeys,
        imageFile: editProductForm.imageFile || undefined,
        descriptionImageFile: editProductForm.descriptionImageFile || undefined,
        options,
      })

      setEditDialogOpen(false)
      setEditingProductId(null)
      await loadDashboard()
      setSuccessMessage('상품 정보를 수정했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 수정에 실패했습니다.'))
    } finally {
      setUpdatingProduct(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm('이 상품을 삭제하시겠습니까?')
    if (!confirmed) {
      return
    }

    setError('')
    try {
      await deleteManagedProduct(productId)
      await loadDashboard()
      setSuccessMessage('상품을 삭제했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 삭제에 실패했습니다.'))
    }
  }

  const handleOrderAction = async (orderId, action) => {
    setActionLoadingOrderId(orderId)
    setError('')

    try {
      await updateOrderStatus(orderId, action)
      await loadDashboard()
      setSuccessMessage('주문 상태를 변경했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '주문 상태 변경에 실패했습니다.'))
    } finally {
      setActionLoadingOrderId(null)
    }
  }

  const handleSaveInquiryAnswer = async (inquiry) => {
    const answerText = String(inquiryDrafts[inquiry.id] || '').trim()

    if (!answerText) {
      setError('답변 내용을 입력해 주세요.')
      return
    }

    setSavingInquiryId(inquiry.id)
    setError('')

    try {
      if (String(inquiry.answer || '').trim()) {
        await updateInquiryAnswer(inquiry.id, answerText)
      } else {
        await answerInquiry(inquiry.id, answerText)
      }

      await loadDashboard()
      setSuccessMessage('문의 답변을 저장했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '문의 답변 저장에 실패했습니다.'))
    } finally {
      setSavingInquiryId(null)
    }
  }

  const handleDeleteInquiry = async (inquiryId) => {
    const confirmed = window.confirm('이 문의를 삭제하시겠습니까?')
    if (!confirmed) {
      return
    }

    setDeletingInquiryId(inquiryId)
    setError('')

    try {
      await deleteInquiry(inquiryId)
      await loadDashboard()
      setSuccessMessage('문의를 삭제했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '문의 삭제에 실패했습니다.'))
    } finally {
      setDeletingInquiryId(null)
    }
  }

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    )
  }

  return (
    <Stack spacing={2.2}>
      <Stack spacing={0.7}>
        <Typography variant="h4" fontWeight={800}>
          슈퍼관리자 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          상품 등록/수정, 주문·배송 처리, 매출 확인, Q&A 답변을 한 곳에서 운영합니다.
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 1.2, '& .MuiTabs-indicator': { backgroundColor: '#111111' } }}
        >
          <Tab value="overview" label="운영 요약" sx={{ fontWeight: 700 }} />
          <Tab value="products" label="상품 관리" sx={{ fontWeight: 700 }} />
          <Tab value="orders" label="주문·배송" sx={{ fontWeight: 700 }} />
          <Tab value="inquiries" label="Q&A" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {activeTab === 'overview' && (
        <Stack spacing={1.4}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
              <Typography variant="body2" color="text.secondary">등록 상품 수</Typography>
              <Typography variant="h4" fontWeight={800}>{myProducts.length}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
              <Typography variant="body2" color="text.secondary">누적 매출</Typography>
              <Typography variant="h4" fontWeight={800}>{formatMoney(totalSalesAmount)}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
              <Typography variant="body2" color="text.secondary">오늘 주문</Typography>
              <Typography variant="h4" fontWeight={800}>{todayOrderCount}건</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
              <Typography variant="body2" color="text.secondary">미답변 Q&A</Typography>
              <Typography variant="h4" fontWeight={800}>{unansweredInquiryCount}건</Typography>
            </Paper>
          </Stack>

          <Paper sx={{ p: 2.0, borderRadius: 2.4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Typography variant="body2" color="text.secondary">배송 확인 필요</Typography>
              <Chip label={`${shippingPendingCount}건`} color={shippingPendingCount > 0 ? 'warning' : 'default'} size="small" />
            </Stack>
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {ORDER_STATUS_FILTER_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => (
                <Chip
                  key={item.value}
                  size="small"
                  variant="outlined"
                  label={`${item.label} ${Number(orderStatusSummary[item.value] || 0)}건`}
                />
              ))}
            </Stack>
          </Paper>
        </Stack>
      )}

      {activeTab === 'products' && (
        <Stack spacing={1.6}>
          <Paper component="form" onSubmit={handleCreateBanner} sx={{ p: 2, borderRadius: 2.4 }}>
            <Stack spacing={1.2}>
              <Typography variant="h6" fontWeight={700}>메인 광고 배너 관리</Typography>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <TextField
                  label="배너 제목(선택)"
                  value={bannerForm.title}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                  fullWidth
                />
                <TextField
                  label="노출 순서(선택)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={bannerForm.displayOrder}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
                  sx={{ minWidth: 180 }}
                />
              </Stack>

              <TextField
                label="배너 설명(선택)"
                value={bannerForm.subtitle}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                fullWidth
              />

              <TextField
                select
                label="연결 상품(선택)"
                value={bannerForm.targetProductId}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, targetProductId: event.target.value }))}
                fullWidth
              >
                <MenuItem value="">선택 안함</MenuItem>
                {myProducts.map((product) => (
                  <MenuItem key={`banner-product-${product.id}`} value={String(product.id)}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>

              <Button component="label" variant="outlined" sx={{ width: 'fit-content' }}>
                배너 이미지 선택(필수)
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setBannerForm((prev) => ({
                      ...prev,
                      imageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </Button>

              <Typography variant="caption" color="text.secondary">
                선택한 배너 이미지: {bannerForm.imageFile?.name || '선택 안됨'}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={savingBanner}>배너 등록</Button>
                <Button type="button" color="inherit" onClick={resetBannerForm}>초기화</Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2.4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2 }}>등록 배너 목록</Typography>
            {banners.length === 0 ? (
              <Typography color="text.secondary">등록된 배너가 없습니다.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>이미지</TableCell>
                      <TableCell>제목</TableCell>
                      <TableCell>연결 상품</TableCell>
                      <TableCell align="right">순서</TableCell>
                      <TableCell align="right">관리</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id} hover>
                        <TableCell>
                          {banner.imageUrl ? (
                            <Box
                              component="img"
                              src={resolveImageUrl(banner.imageUrl)}
                              alt={banner.title || '배너 이미지'}
                              sx={{ width: 66, height: 40, objectFit: 'cover', borderRadius: 1 }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{banner.title || '(제목 없음)'}</TableCell>
                        <TableCell>
                          {banner.targetProductId
                            ? myProducts.find((product) => Number(product.id) === Number(banner.targetProductId))?.name || `#${banner.targetProductId}`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">{banner.displayOrder ?? 0}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={deletingBannerId === banner.id}
                            onClick={() => handleDeleteBanner(banner.id)}
                          >
                            삭제
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2.4 }}>
            <Stack spacing={1.2}>
              <Typography variant="h6" fontWeight={700}>홈 탐색 탭 관리</Typography>
              <Typography variant="body2" color="text.secondary">
                홈 상단 탭을 추가/수정/삭제할 수 있습니다. 비활성 탭은 홈에서 숨겨집니다.
              </Typography>

              <Stack
                component="form"
                onSubmit={handleCreateDiscoveryTab}
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <TextField
                  label="새 탭 이름"
                  value={newDiscoveryTabForm.label}
                  onChange={(event) => setNewDiscoveryTabForm((prev) => ({ ...prev, label: event.target.value }))}
                  required
                  sx={{ minWidth: { md: 220 } }}
                />
                <TextField
                  label="노출 순서(선택)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={newDiscoveryTabForm.displayOrder}
                  onChange={(event) => setNewDiscoveryTabForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
                  sx={{ minWidth: { md: 180 } }}
                />
                <FormControlLabel
                  control={(
                    <Switch
                      checked={newDiscoveryTabForm.active !== false}
                      onChange={(event) => setNewDiscoveryTabForm((prev) => ({ ...prev, active: event.target.checked }))}
                    />
                  )}
                  label="활성"
                />
                <Button type="submit" variant="contained" disabled={creatingDiscoveryTab} sx={{ width: { xs: '100%', md: 'auto' } }}>
                  탭 추가
                </Button>
              </Stack>

              {managedDiscoveryTabs.length === 0 ? (
                <Typography color="text.secondary">탭 정보를 불러오지 못했습니다.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>탭 이름</TableCell>
                        <TableCell align="right">순서</TableCell>
                        <TableCell align="center">활성</TableCell>
                        <TableCell align="right">관리</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {managedDiscoveryTabs.map((tab) => {
                        const draft = discoveryTabDrafts[tab.id] || {
                          label: tab.label,
                          displayOrder: String(tab.displayOrder ?? 0),
                          active: tab.active !== false,
                        }
                        const canManage = tab.id != null
                        return (
                          <TableRow key={`discovery-tab-${tab.id ?? tab.tabKey}`}>
                            <TableCell sx={{ minWidth: 180 }}>
                              <TextField
                                size="small"
                                value={draft.label}
                                disabled={!canManage}
                                onChange={(event) =>
                                  setDiscoveryTabDrafts((prev) => ({
                                    ...prev,
                                    [tab.id]: {
                                      ...draft,
                                      label: event.target.value,
                                    },
                                  }))
                                }
                                fullWidth
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ width: 140 }}>
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0 }}
                                value={draft.displayOrder}
                                disabled={!canManage}
                                onChange={(event) =>
                                  setDiscoveryTabDrafts((prev) => ({
                                    ...prev,
                                    [tab.id]: {
                                      ...draft,
                                      displayOrder: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Switch
                                checked={draft.active !== false}
                                disabled={!canManage}
                                onChange={(event) =>
                                  setDiscoveryTabDrafts((prev) => ({
                                    ...prev,
                                    [tab.id]: {
                                      ...draft,
                                      active: event.target.checked,
                                    },
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <Stack direction="row" spacing={0.7} justifyContent="flex-end">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={!canManage || updatingDiscoveryTabId === tab.id}
                                  onClick={() => handleSaveDiscoveryTab(tab.id)}
                                >
                                  저장
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  disabled={!canManage || deletingDiscoveryTabId === tab.id}
                                  onClick={() => handleDeleteDiscoveryTab(tab.id)}
                                >
                                  삭제
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Stack>
          </Paper>

          <Paper component="form" onSubmit={handleCreateProduct} sx={{ p: 2, borderRadius: 2.4 }}>
            <Stack spacing={1.2}>
              <Typography variant="h6" fontWeight={700}>신규 상품 등록</Typography>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <TextField
                  label="상품명"
                  value={productForm.name}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="카테고리"
                  value={productForm.category}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                  sx={{ minWidth: 180 }}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <TextField
                  label="가격"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={productForm.price}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                  required
                  fullWidth
                />
                <TextField
                  label="총 재고(사이즈 합계)"
                  value={productForm.quantity}
                  InputProps={{ readOnly: true }}
                  placeholder="사이즈 입력 시 자동 계산"
                  fullWidth
                />
                <TextField
                  label="상황 점수(선택)"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={productForm.situationScore}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, situationScore: event.target.value }))}
                  fullWidth
                />
              </Stack>

              <TextField
                label="사이즈별 재고(필수)"
                placeholder="S:10, M:5, L:0"
                value={productForm.optionSpecsText}
                onChange={(event) => {
                  const nextText = event.target.value
                  let nextQuantity = ''
                  try {
                    const parsed = parseOptionSpecs(nextText)
                    nextQuantity = parsed.length
                      ? String(parsed.reduce((sum, option) => sum + Number(option.quantity || 0), 0))
                      : ''
                  } catch {
                    nextQuantity = ''
                  }
                  setProductForm((prev) => ({
                    ...prev,
                    optionSpecsText: nextText,
                    quantity: nextQuantity,
                  }))
                }}
                required
                fullWidth
              />

              <TextField
                label="설명"
                multiline
                minRows={2}
                value={productForm.description}
                onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                fullWidth
              />

              <TextField
                label="키워드(쉼표로 구분)"
                placeholder="입문,기본템,출근룩"
                value={productForm.keywordsText}
                onChange={(event) => setProductForm((prev) => ({ ...prev, keywordsText: event.target.value }))}
                fullWidth
              />

              <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.6 }}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.4 }}>
                  홈 탐색 탭 연결
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>
                  이 상품이 노출될 탭을 선택해 주세요.
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  {assignableDiscoveryTabs.map((tab) => (
                    <FormControlLabel
                      key={`create-discovery-${tab.tabKey}`}
                      control={(
                        <Switch
                          checked={sanitizeDiscoveryTabKeys(productForm.discoveryTabKeys).includes(tab.tabKey)}
                          onChange={(event) => handleToggleCreateProductDiscoveryTab(tab.tabKey, event.target.checked)}
                        />
                      )}
                      label={tab.label}
                    />
                  ))}
                </Stack>
                {assignableDiscoveryTabs.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    활성화된 탐색 탭이 없습니다. 먼저 위에서 탭을 추가하거나 활성화해 주세요.
                  </Typography>
                )}
              </Paper>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <Button component="label" variant="outlined">
                  대표 이미지 선택(필수)
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        imageFile: event.target.files?.[0] || null,
                      }))
                    }
                  />
                </Button>
                <Button component="label" variant="outlined" color="inherit">
                  상세 이미지 선택(선택)
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        descriptionImageFile: event.target.files?.[0] || null,
                      }))
                    }
                  />
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                대표 이미지: {productForm.imageFile?.name || '선택 안됨'} / 상세 이미지: {productForm.descriptionImageFile?.name || '선택 안됨'}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={savingProduct}>상품 등록</Button>
                <Button type="button" color="inherit" onClick={resetCreateForm}>초기화</Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2.4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2 }}>등록 상품 목록</Typography>
            {myProducts.length === 0 ? (
              <Typography color="text.secondary">등록된 상품이 없습니다.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>이미지</TableCell>
                      <TableCell>상품명</TableCell>
                      <TableCell>카테고리</TableCell>
                      <TableCell>사이즈</TableCell>
                      <TableCell align="right">가격</TableCell>
                      <TableCell align="right">재고</TableCell>
                      <TableCell align="right">관리</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myProducts.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          {product.imageUrl ? (
                            <Box
                              component="img"
                              src={resolveImageUrl(product.imageUrl)}
                              alt={product.name}
                              sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1 }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {Array.isArray(product.options) && product.options.length > 0
                            ? product.options.map((option) => `${option.sizeLabel}:${option.quantity}`).join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell align="right">{formatMoney(product.price)}</TableCell>
                        <TableCell align="right">{product.quantity}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.6} justifyContent="flex-end">
                            <Button size="small" variant="outlined" onClick={() => openEditProductDialog(product)}>수정</Button>
                            <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteProduct(product.id)}>삭제</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Stack>
      )}

      {activeTab === 'orders' && (
        <Stack spacing={1.5}>
          <Paper sx={{ p: 2, borderRadius: 2.4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                {ORDER_STATUS_FILTER_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <Chip
                    key={option.value}
                    size="small"
                    variant="outlined"
                    label={`${option.label} ${Number(orderStatusSummary[option.value] || 0)}건`}
                  />
                ))}
              </Stack>

              <TextField
                select
                label="상태 필터"
                size="small"
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2.4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2 }}>주문/배송 처리</Typography>
            {visibleOrders.length === 0 ? (
              <Typography color="text.secondary">조건에 맞는 주문이 없습니다.</Typography>
            ) : (
              <Stack spacing={1.2}>
                {visibleOrders.map((order) => (
                  <Paper key={order.id} variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
                    <Stack spacing={0.9}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
                        <Typography fontWeight={700}>
                          #{order.id} {order.productName}{order.sizeLabel ? ` (${order.sizeLabel})` : ''} x {order.quantity}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(order.orderDate)}</Typography>
                      </Stack>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                        <Chip size="small" variant="outlined" label={ORDER_STATUS_LABELS[order.status] || order.status} />
                        <Typography variant="body2" color="text.secondary">결제금액: {formatMoney(order.totalAmount)}</Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {ORDER_ACTIONS.map((option) => (
                          <Button
                            key={`${order.id}-${option.action}`}
                            size="small"
                            variant="outlined"
                            disabled={actionLoadingOrderId === order.id}
                            onClick={() => handleOrderAction(order.id, option.action)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>
      )}

      {activeTab === 'inquiries' && (
        <Stack spacing={1.5}>
          <Paper sx={{ p: 2, borderRadius: 2.4 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Typography variant="h6" fontWeight={700}>사용자 Q&A 관리</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={inquiryOnlyPending}
                    onChange={(event) => setInquiryOnlyPending(event.target.checked)}
                  />
                }
                label="미답변만 보기"
              />
            </Stack>
          </Paper>

          {visibleInquiries.length === 0 ? (
            <Paper sx={{ p: 2, borderRadius: 2.4 }}>
              <Typography color="text.secondary">표시할 문의가 없습니다.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.2}>
              {visibleInquiries.map((inquiry) => (
                <Paper key={inquiry.id} sx={{ p: 1.6, borderRadius: 2.2 }}>
                  <Stack spacing={1}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
                      <Typography fontWeight={700}>#{inquiry.id} {inquiry.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(inquiry.createdDate)}</Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      작성자: {inquiry.userName || inquiry.userId} / 상품ID: {inquiry.productId ?? '-'}
                    </Typography>

                    <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.6 }}>
                      <Typography variant="body2">{inquiry.content}</Typography>
                    </Paper>

                    <TextField
                      label="답변"
                      multiline
                      minRows={3}
                      value={inquiryDrafts[inquiry.id] ?? ''}
                      onChange={(event) =>
                        setInquiryDrafts((prev) => ({
                          ...prev,
                          [inquiry.id]: event.target.value,
                        }))
                      }
                      fullWidth
                    />

                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={savingInquiryId === inquiry.id}
                        onClick={() => handleSaveInquiryAnswer(inquiry)}
                      >
                        {String(inquiry.answer || '').trim() ? '답변 수정' : '답변 등록'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        disabled={deletingInquiryId === inquiry.id}
                        onClick={() => handleDeleteInquiry(inquiry.id)}
                      >
                        문의 삭제
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>상품 수정</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ pt: 0.6 }}>
            <TextField
              label="상품명"
              value={editProductForm.name}
              onChange={(event) => setEditProductForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="카테고리"
              value={editProductForm.category}
              onChange={(event) => setEditProductForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                label="가격"
                type="number"
                value={editProductForm.price}
                onChange={(event) => setEditProductForm((prev) => ({ ...prev, price: event.target.value }))}
                fullWidth
              />
              <TextField
                label="총 재고(사이즈 합계)"
                value={editProductForm.quantity}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="사이즈별 재고(필수)"
              placeholder="S:10, M:5, L:0"
              value={editProductForm.optionSpecsText}
              onChange={(event) => {
                const nextText = event.target.value
                let nextQuantity = ''
                try {
                  const parsed = parseOptionSpecs(nextText)
                  nextQuantity = parsed.length
                    ? String(parsed.reduce((sum, option) => sum + Number(option.quantity || 0), 0))
                    : ''
                } catch {
                  nextQuantity = ''
                }
                setEditProductForm((prev) => ({
                  ...prev,
                  optionSpecsText: nextText,
                  quantity: nextQuantity,
                }))
              }}
              fullWidth
            />
            <TextField
              label="설명"
              multiline
              minRows={2}
              value={editProductForm.description}
              onChange={(event) => setEditProductForm((prev) => ({ ...prev, description: event.target.value }))}
              fullWidth
            />
            <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.6 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.4 }}>
                홈 탐색 탭 연결
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>
                이 상품이 노출될 탭을 선택해 주세요.
              </Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                {assignableDiscoveryTabs.map((tab) => (
                  <FormControlLabel
                    key={`edit-discovery-${tab.tabKey}`}
                    control={(
                      <Switch
                        checked={sanitizeDiscoveryTabKeys(editProductForm.discoveryTabKeys).includes(tab.tabKey)}
                        onChange={(event) => handleToggleEditProductDiscoveryTab(tab.tabKey, event.target.checked)}
                      />
                    )}
                    label={tab.label}
                  />
                ))}
              </Stack>
              {assignableDiscoveryTabs.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  활성화된 탐색 탭이 없습니다. 먼저 탭을 추가하거나 활성화해 주세요.
                </Typography>
              )}
            </Paper>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button component="label" variant="outlined" color="inherit">
                교체할 대표 이미지 선택(선택)
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setEditProductForm((prev) => ({
                      ...prev,
                      imageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </Button>
              <Button component="label" variant="outlined" color="inherit">
                교체할 상세 이미지 선택(선택)
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setEditProductForm((prev) => ({
                      ...prev,
                      descriptionImageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              대표: {editProductForm.imageFile?.name || '없음'} / 상세: {editProductForm.descriptionImageFile?.name || '없음'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.2, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">닫기</Button>
          <Button variant="contained" disabled={updatingProduct} onClick={handleUpdateProduct}>수정 저장</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default SellerDashboardPage
