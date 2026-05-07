import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import LoginPromptDialog from '../components/LoginPromptDialog'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { addProductToCart, fetchProductById } from '../services/productApi'
import { recordRecentProductView } from '../services/userApi'
import { fetchWishlistStatus, toggleWishlist } from '../services/wishlistApi'
import resolveImageUrl from '../utils/resolveImageUrl'

function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [wishlistSelected, setWishlistSelected] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError('잘못된 상품 경로입니다.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetchProductById(productId)
      setProduct(response.data || null)
      setSelectedOptionId('')
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 상세 정보를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  useEffect(() => {
    let active = true

    const loadWishlistStatus = async () => {
      if (!product?.id || !user || user.userType !== 'user') {
        setWishlistSelected(false)
        setWishlistLoading(false)
        return
      }

      setWishlistLoading(true)
      try {
        const response = await fetchWishlistStatus(product.id)
        if (active) {
          setWishlistSelected(Boolean(response.data))
        }
      } catch (err) {
        if (active && err?.response?.status !== 401) {
          setError(getApiErrorMessage(err, '찜 상태를 불러오지 못했습니다.'))
        }
      } finally {
        if (active) {
          setWishlistLoading(false)
        }
      }
    }

    loadWishlistStatus()
    return () => {
      active = false
    }
  }, [product?.id, user, user?.id, user?.userType])

  useEffect(() => {
    let active = true

    const recordView = async () => {
      if (!product?.id || user?.userType !== 'user') {
        return
      }

      try {
        await recordRecentProductView(product.id)
      } catch (err) {
        if (active && err?.response?.status !== 401) {
          // Keep product detail UX unaffected even if view logging fails.
          console.debug('Failed to record recent product view', err)
        }
      }
    }

    recordView()
    return () => {
      active = false
    }
  }, [product?.id, user?.id, user?.userType])

  const moveToLogin = () => {
    setLoginPromptOpen(false)
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`)
  }

  const handleRequireLogin = () => {
    setLoginPromptOpen(true)
  }

  const handleAddToCart = async () => {
    if (!product || Number(product.quantity || 0) <= 0) {
      setToastMessage('SOLD OUT 상품입니다.')
      return
    }

    const hasOptions = Array.isArray(product.options) && product.options.length > 0
    if (hasOptions && !selectedOptionId) {
      setToastMessage('사이즈를 선택해 주세요.')
      return
    }
    if (hasOptions) {
      const option = product.options.find((item) => String(item.id) === String(selectedOptionId))
      if (!option || Number(option.quantity || 0) <= 0) {
        setToastMessage('선택한 사이즈는 SOLD OUT 입니다.')
        return
      }
    }

    if (!user || user.userType !== 'user') {
      handleRequireLogin()
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const response = await addProductToCart(product.id, selectedOptionId || undefined)
      setToastMessage(response.message || '장바구니에 담았습니다.')
    } catch (err) {
      if (err?.response?.status === 401) {
        handleRequireLogin()
        return
      }
      setError(getApiErrorMessage(err, '장바구니 담기에 실패했습니다.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDirectPurchase = async () => {
    if (!product || Number(product.quantity || 0) <= 0) {
      setToastMessage('SOLD OUT 상품입니다.')
      return
    }

    const hasOptions = Array.isArray(product.options) && product.options.length > 0
    if (hasOptions && !selectedOptionId) {
      setToastMessage('사이즈를 선택해 주세요.')
      return
    }
    if (hasOptions) {
      const option = product.options.find((item) => String(item.id) === String(selectedOptionId))
      if (!option || Number(option.quantity || 0) <= 0) {
        setToastMessage('선택한 사이즈는 SOLD OUT 입니다.')
        return
      }
    }

    if (!user || user.userType !== 'user') {
      handleRequireLogin()
      return
    }

    navigate('/checkout', {
      state: {
        mode: 'product',
        productId: product.id,
        optionId: selectedOptionId || null,
        orderItems: [
          {
            id: product.id,
            name: selectedOption ? `${product.name} (${selectedOption.sizeLabel})` : product.name,
            quantity: 1,
            price: Number(product.price || 0),
            selectedSizeLabel: selectedOption?.sizeLabel || '',
            imageUrl: product.imageUrl || '',
            brandName: String(product.sellerName || 'SOS').trim(),
          },
        ],
        totalAmount: Number(product.price || 0),
      },
    })
  }

  const handleMoveSupport = () => {
    if (!product?.id) {
      return
    }
    const params = new URLSearchParams({
      productId: String(product.id),
      productName: product.name || '',
    })
    navigate(`/support?${params.toString()}`)
  }

  const handleToggleWishlist = async () => {
    if (!product?.id) {
      return
    }

    if (!user) {
      handleRequireLogin()
      return
    }

    if (user.userType !== 'user') {
      setToastMessage('일반 사용자 계정에서만 찜 기능을 사용할 수 있습니다.')
      return
    }

    const nextValue = !wishlistSelected
    setWishlistLoading(true)
    setError('')

    try {
      const response = await toggleWishlist(product.id, nextValue)
      setWishlistSelected(Boolean(response.data))
      setToastMessage(response.message || (nextValue ? '찜에 추가했습니다.' : '찜에서 제거했습니다.'))
    } catch (err) {
      if (err?.response?.status === 401) {
        handleRequireLogin()
        return
      }
      setError(getApiErrorMessage(err, '찜 처리에 실패했습니다.'))
    } finally {
      setWishlistLoading(false)
    }
  }

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (error && !product) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!product) {
    return <Alert severity="info">상품을 찾을 수 없습니다.</Alert>
  }

  const imageSrc = resolveImageUrl(product.imageUrl)
  const descriptionImageSrc = resolveImageUrl(product.descriptionImageUrl)
  const brandName = String(product.sellerName || 'SOS').trim()
  const salePrice = Number(product.price || 0)
  const originalPrice = Number(product.originalPrice || 0)
  const hasSale = Number.isFinite(originalPrice) && originalPrice > salePrice
  const discountRate = hasSale
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0
  const hasStock = Number(product.quantity) > 0
  const hasOptions = Array.isArray(product.options) && product.options.length > 0
  const selectedOption =
    hasOptions && selectedOptionId
      ? product.options.find((option) => String(option.id) === String(selectedOptionId))
      : null
  const selectedOptionStock = selectedOption ? Number(selectedOption.quantity || 0) : 0

  return (
    <Stack spacing={2.2}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack spacing={2.5} direction={{ xs: 'column', md: 'row' }}>
          <Box
            sx={{
              flex: 1,
              minHeight: 280,
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'grey.100',
            }}
          >
            {imageSrc ? (
              <Box
                component="img"
                src={imageSrc}
                alt={product.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Stack sx={{ height: '100%' }} justifyContent="center" alignItems="center">
                <Typography color="text.secondary">이미지 없음</Typography>
              </Stack>
            )}
          </Box>

          <Stack spacing={1.2} sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
              <Stack spacing={0.4}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  {brandName}
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {product.name}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.8}>
                <Button variant="text" size="small" onClick={handleMoveSupport} sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                  상품 문의
                </Button>
                <IconButton
                  size="small"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  sx={{ color: wishlistSelected ? 'error.main' : 'text.secondary' }}
                >
                  {wishlistSelected ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              카테고리: {product.category || '미분류'}
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="baseline" flexWrap="wrap" useFlexGap>
              {hasSale && (
                <Typography variant="h6" sx={{ color: 'error.main', fontWeight: 800 }}>
                  {discountRate}%
                </Typography>
              )}
              <Typography variant="h5" color="primary.main" fontWeight={800}>
                {salePrice.toLocaleString('ko-KR')}원
              </Typography>
              {hasSale && (
                <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                  {originalPrice.toLocaleString('ko-KR')}원
                </Typography>
              )}
            </Stack>
            <Typography variant="body2" color={hasStock ? 'success.main' : 'error.main'}>
              {hasOptions
                ? selectedOption
                  ? selectedOptionStock > 0
                    ? `선택 사이즈 재고: ${selectedOptionStock}`
                    : '선택 사이즈 SOLD OUT'
                  : '사이즈를 선택해 주세요.'
                : hasStock
                  ? `재고: ${product.quantity}`
                  : 'SOLD OUT'}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {hasOptions && (
              <Stack spacing={0.8}>
                <Typography variant="body2" color="text.secondary">
                  사이즈 선택
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  {product.options.map((option) => {
                    const soldOut = Number(option.quantity || 0) <= 0
                    const selected = String(selectedOptionId) === String(option.id)
                    return (
                      <Chip
                        key={option.id}
                        clickable
                        label={soldOut ? `${option.sizeLabel} SOLD OUT` : option.sizeLabel}
                        onClick={() => setSelectedOptionId(String(option.id))}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                      />
                    )
                  })}
                </Stack>
              </Stack>
            )}

            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {product.description || '상세 설명이 등록되지 않았습니다.'}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={handleAddToCart} disabled={actionLoading} fullWidth>
                장바구니 담기
              </Button>
              <Button
                variant="contained"
                onClick={handleDirectPurchase}
                disabled={actionLoading}
                fullWidth
              >
                주문
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {descriptionImageSrc && (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            추가 설명 이미지
          </Typography>
          <Box
            component="img"
            src={descriptionImageSrc}
            alt={`${product.name} 상세`}
            sx={{ width: '100%', borderRadius: 2 }}
          />
        </Paper>
      )}

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

export default ProductDetailPage
