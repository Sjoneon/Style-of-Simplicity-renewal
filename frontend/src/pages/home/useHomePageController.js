import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getApiErrorMessage } from '../../services/api'
import { fetchMainBanners } from '../../services/bannerApi'
import { fetchDiscoveryTabs } from '../../services/discoveryTabApi'
import { fetchProducts } from '../../services/productApi'
import { fetchMyWishlist, toggleWishlist } from '../../services/wishlistApi'
import {
  ALL_CATEGORIES,
  DISCOVERY_FILTER_ALL_TAB,
  FALLBACK_DISCOVERY_TABS,
} from './homeConfig'
import {
  filterProducts,
  findDefaultDiscoveryTabKey,
  mergeAndNormalizeDiscoveryTabs,
  sortProducts,
} from './homeUtils'
import { listTopPopularTerms, readHistory, updateSearchStats } from './homeSearchStorage'

function toArray(data) {
  return Array.isArray(data) ? data : []
}

function buildWishlistMap(wishlistItems) {
  const nextMap = {}
  wishlistItems.forEach((item) => {
    if (item?.id != null) {
      nextMap[item.id] = true
    }
  })
  return nextMap
}

export default function useHomePageController() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [products, setProducts] = useState([])
  const [discoveryTabs, setDiscoveryTabs] = useState([])
  const [banners, setBanners] = useState([])
  const [bannerLoading, setBannerLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [discoveryTab, setDiscoveryTab] = useState(DISCOVERY_FILTER_ALL_TAB.tabKey)

  const [query, setQuery] = useState('')
  const [sortOption, setSortOption] = useState('latest')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [draftQuery, setDraftQuery] = useState('')
  const [draftOnlyInStock, setDraftOnlyInStock] = useState(false)

  const [searchHistory, setSearchHistory] = useState([])
  const [popularTerms, setPopularTerms] = useState([])

  const [bannerIndex, setBannerIndex] = useState(0)
  const [wishlistMap, setWishlistMap] = useState({})
  const [wishlistLoadingProductId, setWishlistLoadingProductId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  const visibleDiscoveryTabs = useMemo(() => mergeAndNormalizeDiscoveryTabs(discoveryTabs), [discoveryTabs])

  useEffect(() => {
    if (visibleDiscoveryTabs.some((tab) => tab.tabKey === discoveryTab)) {
      return
    }
    setDiscoveryTab(findDefaultDiscoveryTabKey(visibleDiscoveryTabs))
  }, [visibleDiscoveryTabs, discoveryTab])

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchProducts()
        setProducts(toArray(response.data))
      } catch (err) {
        setError(getApiErrorMessage(err, '상품 목록을 불러오지 못했습니다.'))
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    const loadDiscoveryTabs = async () => {
      try {
        const response = await fetchDiscoveryTabs()
        setDiscoveryTabs(toArray(response.data))
      } catch {
        setDiscoveryTabs(FALLBACK_DISCOVERY_TABS)
      }
    }

    loadDiscoveryTabs()
  }, [])

  useEffect(() => {
    const loadBanners = async () => {
      setBannerLoading(true)
      try {
        const response = await fetchMainBanners()
        setBanners(toArray(response.data))
      } catch {
        setBanners([])
      } finally {
        setBannerLoading(false)
      }
    }

    loadBanners()
  }, [])

  useEffect(() => {
    setSearchHistory(readHistory(user))
    setPopularTerms(listTopPopularTerms(8))
  }, [user])

  useEffect(() => {
    let active = true

    const loadWishlist = async () => {
      if (!user || user.userType !== 'user') {
        setWishlistMap({})
        setWishlistLoadingProductId(null)
        return
      }

      try {
        const response = await fetchMyWishlist()
        if (!active) {
          return
        }
        setWishlistMap(buildWishlistMap(toArray(response.data)))
      } catch (err) {
        if (active && err?.response?.status !== 401) {
          console.debug('Failed to load wishlist on home', err)
        }
      }
    }

    loadWishlist()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (banners.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [banners.length])

  useEffect(() => {
    setBannerIndex(0)
  }, [banners.length])

  const filteredProducts = useMemo(() => {
    return filterProducts(products, query, selectedCategory, onlyInStock, discoveryTab)
  }, [products, query, selectedCategory, onlyInStock, discoveryTab])

  const visibleProducts = useMemo(() => {
    return sortProducts(filteredProducts, sortOption, discoveryTab)
  }, [filteredProducts, sortOption, discoveryTab])

  const currentBanner = banners[bannerIndex]

  const openSearchDialog = useCallback(() => {
    setDraftQuery(query)
    setDraftOnlyInStock(onlyInStock)
    setSearchDialogOpen(true)
  }, [onlyInStock, query])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('openSearch') !== '1') {
      return
    }

    openSearchDialog()
    params.delete('openSearch')

    const nextSearch = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    )
  }, [location.pathname, location.search, navigate, openSearchDialog])

  const applySearch = useCallback(({ nextQuery, nextOnlyInStock }) => {
    const normalizedQuery = nextQuery.trim()
    setQuery(normalizedQuery)
    setOnlyInStock(nextOnlyInStock)
    setHasSearched(Boolean(normalizedQuery))
    setSearchDialogOpen(false)

    if (normalizedQuery) {
      updateSearchStats(user, normalizedQuery)
      setSearchHistory(readHistory(user))
      setPopularTerms(listTopPopularTerms(8))
    }
  }, [user])

  const moveToLogin = useCallback(() => {
    setLoginPromptOpen(false)
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`)
  }, [location.pathname, location.search, navigate])

  const isWishlistSelected = useCallback((productId) => Boolean(wishlistMap[productId]), [wishlistMap])

  const handleToggleWishlist = useCallback(async (productId) => {
    if (!user) {
      setLoginPromptOpen(true)
      return
    }
    if (user.userType !== 'user') {
      setToastMessage('일반 사용자 계정에서만 찜 기능을 사용할 수 있습니다.')
      return
    }

    const nextValue = !wishlistMap[productId]
    setWishlistLoadingProductId(productId)
    setError('')

    try {
      const response = await toggleWishlist(productId, nextValue)
      setWishlistMap((prev) => ({ ...prev, [productId]: Boolean(response.data) }))
      setToastMessage(response.message || (nextValue ? '찜에 추가했습니다.' : '찜에서 제거했습니다.'))
    } catch (err) {
      if (err?.response?.status === 401) {
        setLoginPromptOpen(true)
        return
      }
      setError(getApiErrorMessage(err, '찜 처리에 실패했습니다.'))
    } finally {
      setWishlistLoadingProductId(null)
    }
  }, [user, wishlistMap])

  const goBannerPrev = useCallback(() => {
    if (!banners.length) {
      return
    }
    setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  const goBannerNext = useCallback(() => {
    if (!banners.length) {
      return
    }
    setBannerIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const handleBannerClick = useCallback(() => {
    if (!currentBanner?.targetProductId) {
      return
    }
    navigate(`/products/${currentBanner.targetProductId}`)
  }, [currentBanner?.targetProductId, navigate])

  return {
    hero: {
      bannerLoading,
      currentBanner,
      banners,
      goBannerPrev,
      goBannerNext,
      handleBannerClick,
    },
    filters: {
      discoveryTab,
      setDiscoveryTab,
      selectedCategory,
      setSelectedCategory,
      visibleDiscoveryTabs,
      sortOption,
      setSortOption,
    },
    listing: {
      error,
      hasSearched,
      query,
      onlyInStock,
      visibleProducts,
      loading,
    },
    searchDialog: {
      searchDialogOpen,
      setSearchDialogOpen,
      draftQuery,
      setDraftQuery,
      draftOnlyInStock,
      setDraftOnlyInStock,
      searchHistory,
      popularTerms,
      applySearch,
    },
    wishlist: {
      handleToggleWishlist,
      isWishlistSelected,
      wishlistLoadingProductId,
    },
    authGuard: {
      loginPromptOpen,
      setLoginPromptOpen,
      moveToLogin,
    },
    feedback: {
      toastMessage,
      setToastMessage,
    },
  }
}
