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
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginPromptDialog from '../components/LoginPromptDialog'
import ProductList from '../components/ProductList'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { fetchMainBanners } from '../services/bannerApi'
import { fetchDiscoveryTabs } from '../services/discoveryTabApi'
import { addProductToCart, fetchProducts } from '../services/productApi'
import resolveImageUrl from '../utils/resolveImageUrl'

const ALL_CATEGORIES = 'ALL'
const BASE_CATEGORIES = ['BEST', 'OUTER', 'TOP', 'BOTTOMS', 'SET CLOTHES', 'SHOES', 'BAG_ACC']

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'priceAsc', label: '가격 낮은순' },
  { value: 'priceDesc', label: '가격 높은순' },
  { value: 'name', label: '이름순' },
]

const FALLBACK_DISCOVERY_TABS = [
  { tabKey: 'starter', label: '처음 시작' },
  { tabKey: 'gift', label: '선물' },
  { tabKey: 'new', label: '신상' },
  { tabKey: 'basic', label: '기본템' },
  { tabKey: 'work', label: '출근 룩' },
]

const DISCOVERY_FILTER_ALL_TAB = { tabKey: '__all__', label: '전체 보기' }
const RANKING_TAB = { tabKey: 'ranking', label: '랭킹' }

const POPULAR_TERMS_KEY = 'sos-popular-search-terms-v1'

function normalizeCategoryKey(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[\s_-]+/g, '')
}

function getHistoryKey(user) {
  return user?.id ? `sos-search-history-user-${user.id}` : 'sos-search-history-guest'
}

function readHistory(user) {
  try {
    const raw = localStorage.getItem(getHistoryKey(user))
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(user, terms) {
  localStorage.setItem(getHistoryKey(user), JSON.stringify(terms))
}

function readPopularTerms() {
  try {
    const raw = localStorage.getItem(POPULAR_TERMS_KEY)
    const parsed = JSON.parse(raw || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePopularTerms(popularMap) {
  localStorage.setItem(POPULAR_TERMS_KEY, JSON.stringify(popularMap))
}

function updateSearchStats(user, query) {
  const keyword = query.trim()
  if (!keyword) {
    return
  }

  const currentHistory = readHistory(user)
  const nextHistory = [keyword, ...currentHistory.filter((item) => item !== keyword)].slice(0, 8)
  writeHistory(user, nextHistory)

  const popularMap = readPopularTerms()
  popularMap[keyword] = Number(popularMap[keyword] || 0) + 1
  writePopularTerms(popularMap)
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

function getProductDiscoveryTabKeys(product) {
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
  if (tabValue === DISCOVERY_FILTER_ALL_TAB.tabKey) {
    return true
  }
  if (tabValue === 'ranking') {
    return true
  }
  return getProductDiscoveryTabKeys(product).includes(tabValue)
}

function sortProducts(products, sortOption, discoveryTab) {
  const list = [...products]

  if (discoveryTab === 'ranking') {
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

function findDefaultDiscoveryTabKey(discoveryTabs) {
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

function mergeAndNormalizeDiscoveryTabs(discoveryTabs) {
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

function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [products, setProducts] = useState([])
  const [discoveryTabs, setDiscoveryTabs] = useState([])
  const [banners, setBanners] = useState([])
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
  const [addingProductId, setAddingProductId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)

  const visibleDiscoveryTabs = useMemo(
    () => mergeAndNormalizeDiscoveryTabs(discoveryTabs),
    [discoveryTabs],
  )

  useEffect(() => {
    if (visibleDiscoveryTabs.some((tab) => tab.tabKey === discoveryTab)) {
      return
    }
    setDiscoveryTab(findDefaultDiscoveryTabKey(visibleDiscoveryTabs))
  }, [visibleDiscoveryTabs, discoveryTab])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchProducts()
      setProducts(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDiscoveryTabs = useCallback(async () => {
    try {
      const response = await fetchDiscoveryTabs()
      setDiscoveryTabs(Array.isArray(response.data) ? response.data : [])
    } catch {
      setDiscoveryTabs(FALLBACK_DISCOVERY_TABS)
    }
  }, [])

  const loadBanners = useCallback(async () => {
    try {
      const response = await fetchMainBanners()
      setBanners(Array.isArray(response.data) ? response.data : [])
    } catch {
      setBanners([])
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadDiscoveryTabs()
  }, [loadDiscoveryTabs])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  useEffect(() => {
    setSearchHistory(readHistory(user))

    const sortedPopularTerms = Object.entries(readPopularTerms())
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 8)
      .map(([term]) => term)

    setPopularTerms(sortedPopularTerms)
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
    const keyword = query.trim().toLowerCase()
    const selectedKey = normalizeCategoryKey(selectedCategory)

    return products.filter((product) => {
      const matchesKeyword =
        keyword.length === 0 ||
        product.name?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword)

      const matchesCategory =
        selectedCategory === ALL_CATEGORIES ||
        normalizeCategoryKey(product.category) === selectedKey

      const matchesStock = !onlyInStock || Number(product.quantity || 0) > 0
      const matchesTab = matchesDiscovery(product, discoveryTab)

      return matchesKeyword && matchesCategory && matchesStock && matchesTab
    })
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

  const applySearch = ({ nextQuery, nextOnlyInStock }) => {
    const normalizedQuery = nextQuery.trim()

    setQuery(normalizedQuery)
    setOnlyInStock(nextOnlyInStock)
    setHasSearched(Boolean(normalizedQuery))
    setSearchDialogOpen(false)

    if (normalizedQuery) {
      updateSearchStats(user, normalizedQuery)
      setSearchHistory(readHistory(user))

      const sortedPopularTerms = Object.entries(readPopularTerms())
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 8)
        .map(([term]) => term)
      setPopularTerms(sortedPopularTerms)
    }
  }

  const moveToLogin = () => {
    setLoginPromptOpen(false)
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`)
  }

  const handleRequireLogin = () => {
    setLoginPromptOpen(true)
  }

  const handleAddToCart = async (productId) => {
    if (!user || user.userType !== 'user') {
      handleRequireLogin()
      return
    }

    setAddingProductId(productId)
    setError('')

    try {
      const response = await addProductToCart(productId)
      setToastMessage(response.message || '장바구니에 상품을 담았습니다.')
    } catch (err) {
      if (err?.response?.status === 401) {
        handleRequireLogin()
        return
      }
      setError(getApiErrorMessage(err, '장바구니 담기에 실패했습니다.'))
    } finally {
      setAddingProductId(null)
    }
  }

  const goBannerPrev = () => {
    if (!banners.length) {
      return
    }
    setBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goBannerNext = () => {
    if (!banners.length) {
      return
    }
    setBannerIndex((prev) => (prev + 1) % banners.length)
  }

  const handleBannerClick = () => {
    if (!currentBanner?.targetProductId) {
      return
    }
    navigate(`/products/${currentBanner.targetProductId}`)
  }

  return (
    <Stack spacing={1.8}>
      <Paper
        sx={{
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#0f0f0f',
          minHeight: { xs: 220, md: 300 },
        }}
      >
        {currentBanner ? (
          <>
            <Box
              component="img"
              src={resolveImageUrl(currentBanner.imageUrl)}
              alt={currentBanner.title || '메인 광고 배너'}
              onClick={handleBannerClick}
              sx={{
                width: '100%',
                height: { xs: 220, md: 300 },
                objectFit: 'cover',
                cursor: currentBanner?.targetProductId ? 'pointer' : 'default',
                filter: 'grayscale(0.08)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.22) 52%, rgba(0,0,0,0.16) 100%)',
                pointerEvents: 'none',
              }}
            />
            <Stack
              spacing={0.8}
              sx={{
                position: 'absolute',
                left: { xs: 20, md: 28 },
                bottom: { xs: 18, md: 24 },
                color: '#ffffff',
              }}
            >
              <Typography variant="overline" sx={{ letterSpacing: 1.1, opacity: 0.84 }}>
                CURATED PICK
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, maxWidth: 560 }}>
                {currentBanner.title || '추천 배너'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.86 }}>
                {currentBanner.subtitle || '판매자가 등록한 메인 광고 배너입니다.'}
              </Typography>
            </Stack>

            {banners.length > 1 && (
              <>
                <IconButton
                  onClick={goBannerPrev}
                  sx={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ffffff',
                    bgcolor: 'rgba(0,0,0,0.36)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.52)' },
                  }}
                >
                  <ChevronLeftRoundedIcon />
                </IconButton>
                <IconButton
                  onClick={goBannerNext}
                  sx={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ffffff',
                    bgcolor: 'rgba(0,0,0,0.36)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.52)' },
                  }}
                >
                  <ChevronRightRoundedIcon />
                </IconButton>
              </>
            )}
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: { xs: 220, md: 300 }, color: '#ffffff' }}>
            <Typography variant="h6">현재 리뉴얼 중입니다. 잠시만 기다려주세요.</Typography>
            <Typography variant="body2" sx={{ opacity: 0.72 }}>
              더욱 좋은 제품으로 찾아 뵙겠습니다.
            </Typography>
          </Stack>
        )}
      </Paper>

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={discoveryTab}
          onChange={(_, value) => setDiscoveryTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 1.2, '& .MuiTabs-indicator': { backgroundColor: '#111111' } }}
        >
          {visibleDiscoveryTabs.map((tab) => (
            <Tab
              key={tab.tabKey}
              value={tab.tabKey}
              label={tab.label}
              sx={{ fontWeight: 700, color: '#555555', '&.Mui-selected': { color: '#111111' } }}
            />
          ))}
        </Tabs>

        <Tabs
          value={selectedCategory}
          onChange={(_, value) => setSelectedCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 1.2, borderTop: '1px solid', borderColor: 'divider', '& .MuiTabs-indicator': { backgroundColor: '#111111' } }}
        >
          <Tab value={ALL_CATEGORIES} label="ALL" sx={{ fontWeight: 700, '&.Mui-selected': { color: '#111111' } }} />
          {BASE_CATEGORIES.map((category) => (
            <Tab
              key={category}
              value={category}
              label={category}
              sx={{ fontWeight: 700, '&.Mui-selected': { color: '#111111' } }}
            />
          ))}
        </Tabs>
      </Paper>

      {!user && (
        <Alert severity="info" variant="outlined" sx={{ borderColor: '#d6d6d6' }}>
          로그인하면 검색 기록이 저장되고, 장바구니 담기와 주문을 사용할 수 있습니다.
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {hasSearched && (
        <Paper sx={{ p: 1.4, borderRadius: 2.6, border: '1px solid', borderColor: 'divider' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
              {query && <Chip size="small" variant="outlined" label={`검색: ${query}`} />}
              {onlyInStock && <Chip size="small" variant="outlined" label="재고 있음" />}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <TextField
                select
                size="small"
                label="정렬"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                sx={{ minWidth: 140 }}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" fontWeight={700}>
                {visibleProducts.length}개
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      )}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ProductList
          products={visibleProducts}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
        />
      )}

      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>상품 검색</DialogTitle>
        <DialogContent>
          <Stack spacing={1.3} sx={{ pt: 0.7 }}>
            <TextField
              autoFocus
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              label="검색어"
              placeholder="상품명 또는 설명"
              fullWidth
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applySearch({
                    nextQuery: draftQuery,
                    nextOnlyInStock: draftOnlyInStock,
                  })
                }
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={draftOnlyInStock}
                  onChange={(event) => setDraftOnlyInStock(event.target.checked)}
                  color="primary"
                />
              }
              label="재고 있는 상품만 보기"
            />

            {searchHistory.length > 0 && (
              <Stack spacing={0.7}>
                <Typography variant="caption" color="text.secondary">
                  최근 검색어
                </Typography>
                <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                  {searchHistory.map((term) => (
                    <Chip
                      key={`history-${term}`}
                      label={term}
                      variant="outlined"
                      clickable
                      onClick={() => setDraftQuery(term)}
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {popularTerms.length > 0 && (
              <Stack spacing={0.7}>
                <Typography variant="caption" color="text.secondary">
                  인기 검색어
                </Typography>
                <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                  {popularTerms.map((term) => (
                    <Chip
                      key={`popular-${term}`}
                      label={term}
                      variant="outlined"
                      clickable
                      onClick={() => setDraftQuery(term)}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.2 }}>
          <Button onClick={() => setSearchDialogOpen(false)} color="inherit">
            닫기
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              applySearch({
                nextQuery: draftQuery,
                nextOnlyInStock: draftOnlyInStock,
              })
            }
          >
            검색 적용
          </Button>
        </DialogActions>
      </Dialog>

      <LoginPromptDialog
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        onLogin={moveToLogin}
      />

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2200}
        onClose={() => setToastMessage('')}
        message={toastMessage}
      />
    </Stack>
  )
}

export default HomePage
