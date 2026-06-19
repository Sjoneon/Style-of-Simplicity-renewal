import { useCallback, useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../services/api'
import {
  createDiscoveryTab,
  deleteDiscoveryTab,
  fetchManagedDiscoveryTabs,
  updateDiscoveryTab,
} from '../../services/discoveryTabApi'
import {
  answerInquiry,
  deleteInquiry,
  fetchAllInquiries,
  INQUIRY_CATEGORY_OPTIONS,
  normalizeInquiryCategory,
  updateInquiryAnswer,
} from '../../services/inquiryApi'
import { fetchSellerOrders, updateOrderStatus } from '../../services/orderApi'
import {
  createMainBanner,
  deleteMainBanner,
  fetchManagedBanners,
} from '../../services/bannerApi'
import {
  createManagedProduct,
  deleteManagedProduct,
  fetchManagedProducts,
  updateManagedProduct,
} from '../../services/productApi'
import {
  buildSalesAnalytics,
  CATEGORY_OPTIONS,
  buildLegacyFlagsFromTabKeys,
  createEmptyProductForm,
  EMPTY_BANNER_FORM,
  EMPTY_DISCOVERY_TAB_FORM,
  FALLBACK_DISCOVERY_TABS,
  formatOptionSpecs,
  parseKeywordsMap,
  parseOptionSpecs,
  parseOptionalDisplayOrder,
  resolveDiscoveryKeys,
  sanitizeDiscoveryTabKeys,
  normalizeManagedDiscoveryTabs,
  ORDER_STATUS_FILTER_OPTIONS,
  PRODUCT_PAGE_SIZE,
  PRODUCT_SORT_OPTIONS,
} from './sellerDashboardUtils'

export const SELLER_INQUIRY_CATEGORY_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  ...INQUIRY_CATEGORY_OPTIONS,
]

function buildProductCategoryFilterOptions(products) {
  const categorySet = new Set(CATEGORY_OPTIONS)
  products.forEach((product) => {
    const category = String(product.category || '').trim().toUpperCase()
    if (category) {
      categorySet.add(category)
    }
  })

  return [
    { value: 'ALL', label: 'ALL' },
    ...[...categorySet].map((category) => ({
      value: category,
      label: category,
    })),
  ]
}

function getRegistrationSortValue(product) {
  const id = Number(product?.id || 0)
  return Number.isFinite(id) ? id : 0
}

function sortProducts(products, sortOrder) {
  const sorted = [...products]
  sorted.sort((a, b) => {
    if (sortOrder === 'OLDEST') {
      return getRegistrationSortValue(a) - getRegistrationSortValue(b)
    }
    if (sortOrder === 'PRICE_DESC') {
      return Number(b.price || 0) - Number(a.price || 0)
    }
    if (sortOrder === 'PRICE_ASC') {
      return Number(a.price || 0) - Number(b.price || 0)
    }
    return getRegistrationSortValue(b) - getRegistrationSortValue(a)
  })
  return sorted
}

function buildDiscoveryTabDraftMap(discoveryTabs) {
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
}

function mergeInquiryDraftMap(inquiries, previousDrafts) {
  const next = {}
  inquiries.forEach((inquiry) => {
    next[inquiry.id] = previousDrafts[inquiry.id] ?? inquiry.answer ?? ''
  })
  return next
}

function syncDiscoveryKeys(previousForm, managedDiscoveryTabKeySet) {
  const currentKeys = sanitizeDiscoveryTabKeys(previousForm.discoveryTabKeys)
  const nextKeys = currentKeys.filter((tabKey) => managedDiscoveryTabKeySet.has(tabKey))

  if (nextKeys.length === currentKeys.length) {
    return previousForm
  }

  return {
    ...previousForm,
    discoveryTabKeys: nextKeys,
    ...buildLegacyFlagsFromTabKeys(nextKeys),
  }
}

function toggleDiscoveryTab(formSetter, tabKey, checked) {
  formSetter((prev) => {
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

export default function useSellerDashboardController(user) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeHomeView, setActiveHomeView] = useState('banner')
  const [activeSalesPeriod, setActiveSalesPeriod] = useState('day')

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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

  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL')
  const [productSortOrder, setProductSortOrder] = useState('RECENT')
  const [productPage, setProductPage] = useState(1)

  const [inquiryAnswerFilter, setInquiryAnswerFilter] = useState('pending')
  const [inquiryCategoryFilter, setInquiryCategoryFilter] = useState('ALL')
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
        fetchManagedProducts(),
        fetchSellerOrders(),
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
      setDiscoveryTabDrafts(buildDiscoveryTabDraftMap(discoveryTabs))
      setInquiryDrafts((prev) => mergeInquiryDraftMap(allInquiries, prev))
    } catch (err) {
      setError(getApiErrorMessage(err, '판매자 대시보드 데이터를 불러오지 못했습니다.'))
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

  const productCategoryFilterOptions = useMemo(() => {
    return buildProductCategoryFilterOptions(myProducts)
  }, [myProducts])

  const filteredProducts = useMemo(() => {
    const categoryFilteredProducts = productCategoryFilter === 'ALL'
      ? myProducts
      : myProducts.filter((product) => String(product.category || '').toUpperCase() === productCategoryFilter)

    return sortProducts(categoryFilteredProducts, productSortOrder)
  }, [myProducts, productCategoryFilter, productSortOrder])

  const productPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE))
  }, [filteredProducts.length])

  const visibleProducts = useMemo(() => {
    const safePage = Math.min(Math.max(productPage, 1), productPageCount)
    const startIndex = (safePage - 1) * PRODUCT_PAGE_SIZE
    return filteredProducts.slice(startIndex, startIndex + PRODUCT_PAGE_SIZE)
  }, [filteredProducts, productPage, productPageCount])

  useEffect(() => {
    setProductPage(1)
  }, [productCategoryFilter, productSortOrder])

  useEffect(() => {
    if (productPage > productPageCount) {
      setProductPage(productPageCount)
    }
  }, [productPage, productPageCount])

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
    return sorted.filter((item) => {
      const hasAnswer = Boolean(String(item.answer || '').trim())
      const matchesAnswerFilter = inquiryAnswerFilter === 'answered' ? hasAnswer : !hasAnswer
      const normalizedCategory = normalizeInquiryCategory(item.category)
      const matchesCategory = inquiryCategoryFilter === 'ALL' || normalizedCategory === inquiryCategoryFilter
      return matchesAnswerFilter && matchesCategory
    })
  }, [inquiries, inquiryAnswerFilter, inquiryCategoryFilter])

  const salesAnalytics = useMemo(() => {
    return buildSalesAnalytics(orders)
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

  const answeredInquiryCount = useMemo(() => {
    return inquiries.filter((inquiry) => String(inquiry.answer || '').trim()).length
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

  const openCreateProductDialog = useCallback(() => {
    resetCreateForm()
    setCreateDialogOpen(true)
  }, [resetCreateForm])

  const closeCreateProductDialog = useCallback(() => {
    setCreateDialogOpen(false)
    resetCreateForm()
  }, [resetCreateForm])

  const closeEditProductDialog = useCallback(() => {
    setEditDialogOpen(false)
    setEditingProductId(null)
    setEditProductForm(createEmptyProductForm(managedDiscoveryTabs))
  }, [managedDiscoveryTabs])

  const resetBannerForm = useCallback(() => {
    setBannerForm(EMPTY_BANNER_FORM)
  }, [])

  useEffect(() => {
    setProductForm((prev) => syncDiscoveryKeys(prev, managedDiscoveryTabKeySet))
    setEditProductForm((prev) => syncDiscoveryKeys(prev, managedDiscoveryTabKeySet))
  }, [managedDiscoveryTabKeySet])

  const handleToggleCreateProductDiscoveryTab = useCallback((tabKey, checked) => {
    toggleDiscoveryTab(setProductForm, tabKey, checked)
  }, [])

  const handleToggleEditProductDiscoveryTab = useCallback((tabKey, checked) => {
    toggleDiscoveryTab(setEditProductForm, tabKey, checked)
  }, [])

  const handleCreateDiscoveryTab = useCallback(async (event) => {
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
  }, [loadDashboard, newDiscoveryTabForm])

  const handleSaveDiscoveryTab = useCallback(async (tabId) => {
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
  }, [discoveryTabDrafts, loadDashboard])

  const handleDeleteDiscoveryTab = useCallback(async (tabId) => {
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
  }, [loadDashboard])

  const handleCreateBanner = useCallback(async (event) => {
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
  }, [bannerForm, loadDashboard, resetBannerForm])

  const handleDeleteBanner = useCallback(async (bannerId) => {
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
  }, [loadDashboard])

  const handleCreateProduct = useCallback(async (event) => {
    event.preventDefault()

    if (!productForm.imageFile) {
      setError('상품 등록 시 대표 이미지는 필수입니다.')
      return
    }

    if (!productForm.descriptionImageFile) {
      const confirmedWithoutDetailImage = window.confirm(
        '상세 이미지가 아직 없습니다. 상세 이미지 없이 등록하면 구매자가 상품 디테일을 파악하기 어렵습니다. 계속 등록할까요?',
      )
      if (!confirmedWithoutDetailImage) {
        return
      }
    }

    const price = Number(productForm.price)
    const originalPrice = productForm.originalPrice === '' ? undefined : Number(productForm.originalPrice)
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
    if (originalPrice !== undefined) {
      if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        setError('정상가는 0 이상의 숫자로 입력해 주세요.')
        return
      }
      if (originalPrice < price) {
        setError('정상가는 판매가 이상으로 입력해 주세요.')
        return
      }
    }

    setSavingProduct(true)
    setError('')

    try {
      await createManagedProduct({
        sellerId: user.id,
        name: productForm.name,
        category: productForm.category,
        price,
        originalPrice,
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
      setCreateDialogOpen(false)
      await loadDashboard()
      setSuccessMessage('상품을 등록했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 등록에 실패했습니다.'))
    } finally {
      setSavingProduct(false)
    }
  }, [loadDashboard, productForm, resetCreateForm, user.id])

  const openEditProductDialog = useCallback((product) => {
    const discoveryTabKeys = resolveDiscoveryKeys(product)
    const discoveryFlags = buildLegacyFlagsFromTabKeys(discoveryTabKeys)
    const currentKeywords = Array.isArray(product.keywords)
      ? product.keywords
          .map((keyword) => String(keyword || '').trim())
          .filter(Boolean)
      : []

    setEditingProductId(product.id)
    setEditProductForm({
      name: product.name || '',
      category: product.category || 'TOP',
      price: String(product.price ?? ''),
      originalPrice: product.originalPrice == null ? '' : String(product.originalPrice),
      quantity: String(product.quantity ?? ''),
      optionSpecsText: formatOptionSpecs(product.options),
      description: product.description || '',
      situationScore: product.situationScore ?? '',
      keywordsText: currentKeywords.join(', '),
      discoveryTabKeys,
      ...discoveryFlags,
      imageFile: null,
      descriptionImageFile: null,
    })
    setEditDialogOpen(true)
  }, [])

  const handleUpdateProduct = useCallback(async () => {
    if (!editingProductId) {
      setError('수정할 상품 ID를 찾지 못했습니다. 상품 목록에서 다시 시도해 주세요.')
      return
    }

    const price = Number(editProductForm.price)
    const originalPrice = editProductForm.originalPrice === '' ? undefined : Number(editProductForm.originalPrice)
    const optionSpecsText = String(editProductForm.optionSpecsText || '').trim()
    const hasOptionSpecs = optionSpecsText.length > 0
    let options
    let quantity

    if (hasOptionSpecs) {
      try {
        options = parseOptionSpecs(optionSpecsText)
      } catch (parseError) {
        setError(parseError.message)
        return
      }

      if (!options.length) {
        setError('사이즈별 재고를 1개 이상 입력해 주세요. 예: S:10, M:5')
        return
      }

      quantity = options.reduce((sum, option) => sum + Number(option.quantity || 0), 0)
    } else {
      quantity = Number(editProductForm.quantity)
      if (!Number.isInteger(quantity) || quantity < 0) {
        setError('총 재고는 0 이상의 정수여야 합니다.')
        return
      }
      options = undefined
    }

    const discoveryTabKeys = sanitizeDiscoveryTabKeys(editProductForm.discoveryTabKeys)
    const legacyDiscoveryFlags = buildLegacyFlagsFromTabKeys(discoveryTabKeys)

    if (!Number.isFinite(price) || price < 0) {
      setError('가격은 0 이상의 숫자로 입력해 주세요.')
      return
    }
    if (originalPrice !== undefined) {
      if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        setError('정상가는 0 이상의 숫자로 입력해 주세요.')
        return
      }
      if (originalPrice < price) {
        setError('정상가는 판매가 이상으로 입력해 주세요.')
        return
      }
    }

    setUpdatingProduct(true)
    setError('')

    try {
      await updateManagedProduct(editingProductId, {
        name: editProductForm.name,
        category: editProductForm.category,
        price,
        originalPrice,
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
        keywords: parseKeywordsMap(editProductForm.keywordsText),
        options: hasOptionSpecs ? options : undefined,
      })

      closeEditProductDialog()
      await loadDashboard()
      setSuccessMessage('상품 정보를 수정했습니다.')
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 수정에 실패했습니다.'))
    } finally {
      setUpdatingProduct(false)
    }
  }, [closeEditProductDialog, editProductForm, editingProductId, loadDashboard])

  const handleDeleteProduct = useCallback(async (productId) => {
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
  }, [loadDashboard])

  const handleOrderAction = useCallback(async (orderId, action) => {
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
  }, [loadDashboard])

  const handleSaveInquiryAnswer = useCallback(async (inquiry) => {
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
  }, [inquiryDrafts, loadDashboard])

  const handleDeleteInquiry = useCallback(async (inquiryId) => {
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
  }, [loadDashboard])

  return {
    ui: {
      loading,
      error,
      setError,
      successMessage,
      setSuccessMessage,
      activeTab,
      setActiveTab,
    },
    data: {
      myProducts,
      visibleProducts,
      filteredProductsCount: filteredProducts.length,
      productCategoryFilterOptions,
      banners,
      orders,
      inquiries,
      managedDiscoveryTabs,
      discoveryTabDrafts,
      setDiscoveryTabDrafts,
      assignableDiscoveryTabs,
    },
    metrics: {
      totalSalesAmount: salesAnalytics.totalSalesAmount,
      dailySalesAmount: salesAnalytics.dailySalesAmount,
      monthlySalesAmount: salesAnalytics.monthlySalesAmount,
      yearlySalesAmount: salesAnalytics.yearlySalesAmount,
      salesCharts: salesAnalytics.charts,
      todayOrderCount,
      shippingPendingCount,
      unansweredInquiryCount,
      answeredInquiryCount,
      orderStatusSummary,
    },
    orderView: {
      orderStatusFilter,
      setOrderStatusFilter,
      visibleOrders,
      actionLoadingOrderId,
      orderStatusFilterOptions: ORDER_STATUS_FILTER_OPTIONS,
    },
    inquiryView: {
      inquiryAnswerFilter,
      setInquiryAnswerFilter,
      inquiryCategoryFilter,
      setInquiryCategoryFilter,
      inquiryDrafts,
      setInquiryDrafts,
      visibleInquiries,
      savingInquiryId,
      deletingInquiryId,
      inquiryCategoryFilterOptions: SELLER_INQUIRY_CATEGORY_FILTER_OPTIONS,
    },
    homeManageView: {
      activeHomeView,
      setActiveHomeView,
      bannerForm,
      setBannerForm,
      savingBanner,
      deletingBannerId,
      newDiscoveryTabForm,
      setNewDiscoveryTabForm,
      creatingDiscoveryTab,
      updatingDiscoveryTabId,
      deletingDiscoveryTabId,
    },
    productManageView: {
      productCategoryFilter,
      setProductCategoryFilter,
      productSortOrder,
      setProductSortOrder,
      productPage,
      setProductPage,
      productPageCount,
      pageSize: PRODUCT_PAGE_SIZE,
      sortOptions: PRODUCT_SORT_OPTIONS,
    },
    salesView: {
      activeSalesPeriod,
      setActiveSalesPeriod,
    },
    productDialogView: {
      createDialogOpen,
      productForm,
      setProductForm,
      savingProduct,
      editDialogOpen,
      editProductForm,
      setEditProductForm,
      updatingProduct,
    },
    actions: {
      openCreateProductDialog,
      closeCreateProductDialog,
      openEditProductDialog,
      closeEditProductDialog,
      resetBannerForm,
      handleToggleCreateProductDiscoveryTab,
      handleToggleEditProductDiscoveryTab,
      handleCreateDiscoveryTab,
      handleSaveDiscoveryTab,
      handleDeleteDiscoveryTab,
      handleCreateBanner,
      handleDeleteBanner,
      handleCreateProduct,
      handleUpdateProduct,
      handleDeleteProduct,
      handleOrderAction,
      handleSaveInquiryAnswer,
      handleDeleteInquiry,
    },
  }
}
