import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { fetchMyInquiries } from '../services/inquiryApi'
import { fetchMyOrders } from '../services/orderApi'
import { changeMyPassword, updateMyAddress, updateMyProfile } from '../services/userApi'
import { fetchMyWishlist, removeFromWishlist } from '../services/wishlistApi'
import { openKakaoPostcode } from '../utils/loadKakaoPostcode'
import resolveImageUrl from '../utils/resolveImageUrl'

const ORDER_STATUS_LABELS = {
  ORDERED: '결제완료/배송대기',
  PROCESSED: '배송중(처리)',
  CANCELLED: '취소',
  RETURNED: '반품',
  EXCHANGED: '교환',
}

const ORDER_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ORDERED', label: ORDER_STATUS_LABELS.ORDERED },
  { value: 'PROCESSED', label: ORDER_STATUS_LABELS.PROCESSED },
  { value: 'CANCELLED', label: ORDER_STATUS_LABELS.CANCELLED },
  { value: 'RETURNED', label: ORDER_STATUS_LABELS.RETURNED },
  { value: 'EXCHANGED', label: ORDER_STATUS_LABELS.EXCHANGED },
]

const SECTION_SX = {
  p: { xs: 1.7, md: 2 },
  borderRadius: 2,
  border: '1px solid',
  borderColor: '#e8e8e8',
  boxShadow: 'none',
  bgcolor: '#ffffff',
}

const ITEM_SX = {
  p: 1.1,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: '#ededed',
  bgcolor: '#fafafa',
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return String(value).replace('T', ' ').slice(0, 16)
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('ko-KR')
}

function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[String(status || '')] || String(status || '상태 미정')
}

function normalizeOrders(rawOrders) {
  if (!Array.isArray(rawOrders)) {
    return []
  }

  return [...rawOrders].sort((a, b) =>
    String(b?.orderDate || '').localeCompare(String(a?.orderDate || '')),
  )
}

function normalizeInquiries(rawInquiries) {
  if (!Array.isArray(rawInquiries)) {
    return []
  }

  return [...rawInquiries].sort((a, b) =>
    String(b?.createdDate || '').localeCompare(String(a?.createdDate || '')),
  )
}

function normalizeWishlist(rawItems) {
  if (!Array.isArray(rawItems)) {
    return []
  }
  return rawItems
}

const EMPTY_PROFILE_FORM = {
  name: '',
  phone: '',
}

const EMPTY_ADDRESS_FORM = {
  postcode: '',
  address: '',
  detailAddress: '',
}

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function composeAddressValue(addressForm) {
  const mainAddress = String(addressForm?.address || '').trim()
  const detailAddress = String(addressForm?.detailAddress || '').trim()
  const postcode = String(addressForm?.postcode || '').trim()

  if (!mainAddress) {
    return ''
  }

  const addressWithPostcode = postcode ? `(${postcode}) ${mainAddress}` : mainAddress
  return detailAddress ? `${addressWithPostcode} ${detailAddress}`.trim() : addressWithPostcode
}

function parseAddressValue(rawAddress) {
  const safeAddress = String(rawAddress || '').trim()
  if (!safeAddress) {
    return { ...EMPTY_ADDRESS_FORM }
  }

  const matched = safeAddress.match(/^\((\d{5})\)\s*(.*)$/)
  if (!matched) {
    return {
      ...EMPTY_ADDRESS_FORM,
      address: safeAddress,
    }
  }

  return {
    ...EMPTY_ADDRESS_FORM,
    postcode: String(matched[1] || '').trim(),
    address: String(matched[2] || '').trim(),
  }
}

function MyPagePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, authLoading, refreshSession, logout } = useAuth()
  const redirectingRef = useRef(false)

  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [removingWishlistProductId, setRemovingWishlistProductId] = useState(null)
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM)
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM)
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [openingAddressSearch, setOpeningAddressSearch] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [expandedSection, setExpandedSection] = useState(false)

  const isUserAccount = user?.userType === 'user'
  const isSellerAccount = user?.userType === 'seller'

  const moveToLogin = useCallback(() => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`, { replace: true })
  }, [location.pathname, location.search, navigate])

  const handleUnauthorized = useCallback(
    async (err) => {
      if (err?.response?.status !== 401) {
        return false
      }

      if (redirectingRef.current) {
        return true
      }

      redirectingRef.current = true
      setError('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
      setOrders([])
      setInquiries([])
      setWishlistItems([])

      await refreshSession()
      moveToLogin()
      return true
    },
    [moveToLogin, refreshSession],
  )

  const loadMyPageData = useCallback(async () => {
    if (!isUserAccount) {
      setOrders([])
      setInquiries([])
      setWishlistItems([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const [orderResponse, inquiryList, wishlistResponse] = await Promise.all([
        fetchMyOrders(),
        fetchMyInquiries(),
        fetchMyWishlist(),
      ])
      setOrders(normalizeOrders(orderResponse.data))
      setInquiries(normalizeInquiries(inquiryList))
      setWishlistItems(normalizeWishlist(wishlistResponse.data))
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setError(getApiErrorMessage(err, '마이페이지 정보를 불러오지 못했습니다.'))
      }
      setOrders([])
      setInquiries([])
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }, [handleUnauthorized, isUserAccount])

  useEffect(() => {
    setStatusFilter('ALL')
    loadMyPageData()
  }, [loadMyPageData, user?.id])

  useEffect(() => {
    if (!isUserAccount || !user) {
      setProfileForm(EMPTY_PROFILE_FORM)
      setAddressForm(EMPTY_ADDRESS_FORM)
      setPasswordForm(EMPTY_PASSWORD_FORM)
      return
    }

    setProfileForm({
      name: String(user.name || ''),
      phone: String(user.phone || ''),
    })
    setAddressForm({
      ...parseAddressValue(user.address),
    })
    setPasswordForm(EMPTY_PASSWORD_FORM)
  }, [isUserAccount, user, user?.id, user?.name, user?.phone, user?.address])

  const visibleOrders = useMemo(() => {
    if (statusFilter === 'ALL') {
      return orders
    }
    return orders.filter((order) => String(order.status) === statusFilter)
  }, [orders, statusFilter])

  const orderSummary = useMemo(() => {
    return {
      total: orders.length,
      ordered: orders.filter((order) => order.status === 'ORDERED').length,
      processed: orders.filter((order) => order.status === 'PROCESSED').length,
      cancelled: orders.filter((order) => order.status === 'CANCELLED').length,
      returned: orders.filter((order) => order.status === 'RETURNED').length,
      exchanged: orders.filter((order) => order.status === 'EXCHANGED').length,
    }
  }, [orders])

  const inquirySummary = useMemo(() => {
    const pending = inquiries.filter((inquiry) => !String(inquiry.answer || '').trim()).length
    const answered = Math.max(0, inquiries.length - pending)

    return {
      total: inquiries.length,
      pending,
      answered,
    }
  }, [inquiries])

  const recentInquiries = useMemo(() => inquiries.slice(0, 3), [inquiries])
  const resolvedAddressValue = useMemo(() => composeAddressValue(addressForm), [addressForm])

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? false : section))
  }

  const handleRemoveWishlist = async (productId) => {
    if (!isUserAccount) {
      setError('일반 사용자 계정에서만 찜 기능을 사용할 수 있습니다.')
      return
    }

    setRemovingWishlistProductId(productId)
    setError('')
    try {
      await removeFromWishlist(productId)
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId))
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setError(getApiErrorMessage(err, '찜 해제에 실패했습니다.'))
      }
    } finally {
      setRemovingWishlistProductId(null)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()

    if (!isUserAccount) {
      setAccountError('일반 사용자 계정만 회원정보를 수정할 수 있습니다.')
      return
    }

    const payload = {
      name: String(profileForm.name || '').trim(),
      phone: String(profileForm.phone || '').trim(),
      address: composeAddressValue(addressForm) || String(user?.address || '').trim(),
    }

    if (!payload.name || !payload.phone) {
      setAccountError('이름과 연락처를 모두 입력해 주세요.')
      return
    }

    if (!payload.address) {
      setAccountError('배송지 주소를 먼저 입력해 주세요.')
      return
    }

    setSavingProfile(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      await updateMyProfile(payload)
      await refreshSession()
      setAccountSuccess('회원정보를 수정했습니다.')
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setAccountError(getApiErrorMessage(err, '회원정보 수정에 실패했습니다.'))
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddressSubmit = async (event) => {
    event.preventDefault()

    if (!isUserAccount) {
      setAccountError('일반 사용자 계정만 배송지를 수정할 수 있습니다.')
      return
    }

    const safeAddress = composeAddressValue(addressForm)
    if (!safeAddress) {
      setAccountError('주소 검색으로 기본 주소를 선택해 주세요.')
      return
    }

    setSavingAddress(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      await updateMyAddress({ address: safeAddress })
      await refreshSession()
      setAccountSuccess('배송지 주소를 수정했습니다.')
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setAccountError(getApiErrorMessage(err, '배송지 수정에 실패했습니다.'))
      }
    } finally {
      setSavingAddress(false)
    }
  }

  const handleOpenAddressSearch = async () => {
    setAccountError('')
    setOpeningAddressSearch(true)
    try {
      await openKakaoPostcode(({ postcode, address }) => {
        setAddressForm((prev) => ({
          ...prev,
          postcode: String(postcode || '').trim(),
          address: String(address || '').trim(),
        }))
      })
    } catch (err) {
      setAccountError(getApiErrorMessage(err, '주소 검색을 열지 못했습니다.'))
    } finally {
      setOpeningAddressSearch(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (!isUserAccount) {
      setAccountError('일반 사용자 계정만 비밀번호를 변경할 수 있습니다.')
      return
    }

    const currentPassword = String(passwordForm.currentPassword || '').trim()
    const newPassword = String(passwordForm.newPassword || '').trim()
    const confirmPassword = String(passwordForm.confirmPassword || '').trim()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setAccountError('현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.')
      return
    }

    if (newPassword !== confirmPassword) {
      setAccountError('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setSavingPassword(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      await changeMyPassword({ currentPassword, newPassword })
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setAccountSuccess('비밀번호를 변경했습니다. 다시 로그인해 주세요.')
      await refreshSession()
      moveToLogin()
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setAccountError(getApiErrorMessage(err, '비밀번호 변경에 실패했습니다.'))
      }
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <Stack spacing={1.2}>
      <Paper sx={SECTION_SX}>
        <Stack spacing={1.1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={800}>마이</Typography>
            <Typography variant="caption" color="text.secondary">MY PAGE</Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #dcdcdc', bgcolor: '#f3f3f3' }} />
            <Typography fontWeight={700}>{user?.name || '사용자'} 님</Typography>
            <Typography variant="body2" color="text.secondary">환영합니다</Typography>
          </Stack>

          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`주문 ${orderSummary.total}건`} />
            <Chip size="small" variant="outlined" label={`문의 ${inquirySummary.total}건`} />
            <Chip size="small" variant="outlined" label={`찜 ${wishlistItems.length}건`} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            아래 항목을 눌러 세부 정보를 확인하세요.
          </Typography>
        </Stack>
      </Paper>

      {authLoading ? (
        <Paper sx={SECTION_SX}>
          <Stack alignItems="center" spacing={1} sx={{ py: 2 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">세션을 확인하고 있습니다.</Typography>
          </Stack>
        </Paper>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <Paper sx={SECTION_SX}>
            <Stack spacing={1.1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => toggleSection('orders')}
                sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography fontWeight={800}>1. 주문 관리</Typography>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{`전체 ${orderSummary.total}건`}</Typography>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: expandedSection === 'orders' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </Stack>
              </Button>

              {expandedSection === 'orders' && (
                isUserAccount ? (
                  <>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
                      <TextField
                        select
                        size="small"
                        label="주문 상태"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        sx={{ minWidth: 190 }}
                      >
                        {ORDER_FILTER_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button variant="outlined" onClick={loadMyPageData} disabled={loading}>
                        새로고침
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" label={`결제완료 ${orderSummary.ordered}`} />
                      <Chip size="small" variant="outlined" label={`배송중 ${orderSummary.processed}`} />
                      <Chip size="small" variant="outlined" label={`취소 ${orderSummary.cancelled}`} />
                      <Chip size="small" variant="outlined" label={`반품 ${orderSummary.returned}`} />
                      <Chip size="small" variant="outlined" label={`교환 ${orderSummary.exchanged}`} />
                    </Stack>

                    {loading ? (
                      <Stack alignItems="center" sx={{ py: 2.5 }}>
                        <CircularProgress size={22} />
                      </Stack>
                    ) : visibleOrders.length === 0 ? (
                      <Stack spacing={0.5} sx={ITEM_SX}>
                        <Typography color="text.secondary">
                          {statusFilter === 'ALL' ? '주문 내역이 없습니다.' : '선택한 상태의 주문이 없습니다.'}
                        </Typography>
                        <Button variant="text" onClick={() => navigate('/')} sx={{ alignSelf: 'flex-start', px: 0 }}>
                          상품 보러가기
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing={0.8}>
                        {visibleOrders.map((order) => (
                          <Paper key={order.id} variant="outlined" sx={ITEM_SX}>
                            <Stack spacing={0.45}>
                              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.5}>
                                <Typography fontWeight={700}>#{order.id} {order.productName || '상품명 없음'}</Typography>
                                <Typography fontWeight={700}>{formatPrice(order.totalAmount)}원</Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                                <Chip size="small" variant="outlined" label={getOrderStatusLabel(order.status)} />
                                <Chip size="small" variant="outlined" label={`수량 ${order.quantity || 0}`} />
                                {order.sizeLabel && <Chip size="small" variant="outlined" label={`사이즈 ${order.sizeLabel}`} />}
                              </Stack>

                              <Typography variant="caption" color="text.secondary">주문일: {formatDateTime(order.orderDate)}</Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </>
                ) : (
                  <Stack spacing={0.8} sx={ITEM_SX}>
                    <Typography color="text.secondary">일반 사용자 계정에서 주문 내역을 확인할 수 있습니다.</Typography>
                    {isSellerAccount && (
                      <Button variant="outlined" onClick={() => navigate('/admin/dashboard')} sx={{ alignSelf: 'flex-start' }}>
                        판매자 대시보드로 이동
                      </Button>
                    )}
                  </Stack>
                )
              )}
            </Stack>
          </Paper>

          <Paper sx={SECTION_SX}>
            <Stack spacing={1.1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => toggleSection('benefits')}
                sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography fontWeight={800}>2. 혜택 관리</Typography>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography variant="body2" color="text.secondary">쿠폰 0장 · 적립금 0P</Typography>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: expandedSection === 'benefits' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </Stack>
              </Button>

              {expandedSection === 'benefits' && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
                  <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">보유 쿠폰</Typography>
                    <Typography fontWeight={700}>0장</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">적립금</Typography>
                    <Typography fontWeight={700}>0P</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">사용 가능 혜택</Typography>
                    <Typography fontWeight={700}>준비중</Typography>
                  </Paper>
                </Stack>
              )}
            </Stack>
          </Paper>

          <Paper sx={SECTION_SX}>
            <Stack spacing={1.1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => toggleSection('interest')}
                sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography fontWeight={800}>3. 찜/최근 본</Typography>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{`찜 ${wishlistItems.length}건`}</Typography>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: expandedSection === 'interest' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </Stack>
              </Button>

              {expandedSection === 'interest' && (
                !isUserAccount ? (
                  <Typography color="text.secondary" variant="body2">
                    일반 사용자 계정에서 찜 목록을 사용할 수 있습니다.
                  </Typography>
                ) : (
                  <Stack spacing={0.8}>
                    {loading ? (
                      <Stack alignItems="center" sx={{ py: 2 }}>
                        <CircularProgress size={20} />
                      </Stack>
                    ) : wishlistItems.length === 0 ? (
                      <Paper variant="outlined" sx={ITEM_SX}>
                        <Stack spacing={0.6}>
                          <Typography color="text.secondary">찜한 상품이 없습니다.</Typography>
                          <Button variant="text" onClick={() => navigate('/')} sx={{ alignSelf: 'flex-start', px: 0 }}>
                            상품 둘러보기
                          </Button>
                        </Stack>
                      </Paper>
                    ) : (
                      <Stack spacing={0.7}>
                        {wishlistItems.map((item) => {
                          const imageSrc = resolveImageUrl(item.imageUrl)
                          return (
                            <Paper key={item.id} variant="outlined" sx={ITEM_SX}>
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                spacing={0.8}
                              >
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 52,
                                      height: 52,
                                      borderRadius: 1.2,
                                      bgcolor: '#f2f2f2',
                                      border: '1px solid #e5e5e5',
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {imageSrc ? (
                                      <Box
                                        component="img"
                                        src={imageSrc}
                                        alt={item.name || '상품 이미지'}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : null}
                                  </Box>
                                  <Stack spacing={0.2}>
                                    <Typography fontWeight={700}>{item.name || '상품명 없음'}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {(item.category || '미분류')} · {formatPrice(item.price)}원
                                    </Typography>
                                  </Stack>
                                </Stack>

                                <Stack direction="row" spacing={0.6}>
                                  <Button
                                    variant="text"
                                    onClick={() => navigate(`/products/${item.id}`)}
                                  >
                                    상품 보기
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleRemoveWishlist(item.id)}
                                    disabled={removingWishlistProductId === item.id}
                                  >
                                    {removingWishlistProductId === item.id ? '해제 중...' : '찜 해제'}
                                  </Button>
                                </Stack>
                              </Stack>
                            </Paper>
                          )
                        })}
                      </Stack>
                    )}

                    <Paper variant="outlined" sx={ITEM_SX}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack spacing={0.2}>
                          <Typography fontWeight={700}>최근 본 상품</Typography>
                          <Typography variant="caption" color="text.secondary">최근 본 상품 기록 연동 준비중</Typography>
                        </Stack>
                        <Typography color="text.secondary">&gt;</Typography>
                      </Stack>
                    </Paper>
                  </Stack>
                )
              )}
            </Stack>
          </Paper>

          <Paper sx={SECTION_SX}>
            <Stack spacing={1.1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => toggleSection('reviews')}
                sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography fontWeight={800}>4. 리뷰/문의 내역</Typography>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{`문의 ${inquirySummary.total}건`}</Typography>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: expandedSection === 'reviews' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </Stack>
              </Button>

              {expandedSection === 'reviews' && (
                <>
                  <Paper variant="outlined" sx={ITEM_SX}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack spacing={0.2}>
                        <Typography fontWeight={700}>내 리뷰</Typography>
                        <Typography variant="caption" color="text.secondary">리뷰 작성/조회 기능 연동 준비중</Typography>
                      </Stack>
                      <Typography color="text.secondary">&gt;</Typography>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={ITEM_SX}>
                    <Stack spacing={0.8}>
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={`문의 전체 ${inquirySummary.total}건`} />
                        <Chip size="small" variant="outlined" label={`답변 대기 ${inquirySummary.pending}건`} />
                        <Chip size="small" variant="outlined" label={`답변 완료 ${inquirySummary.answered}건`} />
                      </Stack>

                      {!isUserAccount ? (
                        <Typography color="text.secondary" variant="body2">
                          일반 사용자 계정에서 문의 내역을 조회할 수 있습니다.
                        </Typography>
                      ) : recentInquiries.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">등록된 문의가 없습니다.</Typography>
                      ) : (
                        <Stack spacing={0.55}>
                          {recentInquiries.map((inquiry) => (
                            <Stack key={inquiry.id} spacing={0.1}>
                              <Typography variant="body2" fontWeight={700}>#{inquiry.id} {inquiry.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {String(inquiry.answer || '').trim() ? '답변 완료' : '답변 대기'} · {formatDateTime(inquiry.createdDate)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}

                      <Button variant="outlined" onClick={() => navigate('/support')} sx={{ alignSelf: 'flex-start' }}>
                        고객센터 이동
                      </Button>
                    </Stack>
                  </Paper>
                </>
              )}
            </Stack>
          </Paper>

          <Paper sx={SECTION_SX}>
            <Stack spacing={1.1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => toggleSection('shipping')}
                sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography fontWeight={800}>5. 배송지 관리</Typography>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {resolvedAddressValue ? '기본 배송지 등록됨' : '배송지 미등록'}
                  </Typography>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: expandedSection === 'shipping' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </Stack>
              </Button>

              {expandedSection === 'shipping' && (
                <>
                  {accountError && <Alert severity="error">{accountError}</Alert>}
                  {accountSuccess && (
                    <Alert severity="success" onClose={() => setAccountSuccess('')}>
                      {accountSuccess}
                    </Alert>
                  )}

                  {isUserAccount ? (
                    <Paper variant="outlined" sx={ITEM_SX}>
                      <Stack component="form" spacing={0.8} onSubmit={handleAddressSubmit}>
                        <Typography fontWeight={700}>배송지 수정</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} alignItems={{ xs: 'stretch', sm: 'center' }}>
                          <TextField
                            label="우편번호"
                            size="small"
                            value={addressForm.postcode}
                            fullWidth
                            InputProps={{ readOnly: true }}
                          />
                          <Button
                            type="button"
                            variant="outlined"
                            onClick={handleOpenAddressSearch}
                            disabled={openingAddressSearch}
                            sx={{ minWidth: { xs: '100%', sm: 120 } }}
                          >
                            {openingAddressSearch ? '검색 중...' : '주소 검색'}
                          </Button>
                        </Stack>
                        <TextField
                          label="기본 주소"
                          size="small"
                          value={addressForm.address}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, address: event.target.value }))}
                          placeholder="주소 검색 버튼으로 입력하세요."
                          fullWidth
                          required
                        />
                        <TextField
                          label="상세 주소"
                          size="small"
                          value={addressForm.detailAddress}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, detailAddress: event.target.value }))}
                          placeholder="동/호수, 건물명 등"
                          fullWidth
                        />
                        {resolvedAddressValue && (
                          <Typography variant="caption" color="text.secondary">
                            저장 예정 주소: {resolvedAddressValue}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          주소 검색으로 기본 주소를 선택하고 상세 주소를 입력해 주세요.
                        </Typography>
                        <Button
                          type="submit"
                          variant="outlined"
                          disabled={savingAddress || openingAddressSearch}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          {savingAddress ? '저장 중...' : '배송지 저장'}
                        </Button>
                      </Stack>
                    </Paper>
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      일반 사용자 계정에서 배송지 관리 기능을 사용할 수 있습니다.
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Paper>

          <Paper sx={SECTION_SX}>
            <Stack spacing={1.1}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => toggleSection('account')}
                sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography fontWeight={800}>6. 계정 관리</Typography>
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{user?.name || '-'}</Typography>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{ transform: expandedSection === 'account' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  />
                </Stack>
              </Button>

              {expandedSection === 'account' && (
                <>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
                    <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
                      <Stack spacing={0.55}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography color="text.secondary">이름</Typography>
                          <Typography fontWeight={700}>{user?.name || '-'}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography color="text.secondary">연락 식별 정보</Typography>
                          <Typography fontWeight={700}>
                            {isSellerAccount ? (user?.businessNumber || '-') : (user?.email || '-')}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
                      <Stack spacing={0.7}>
                        <Button variant="outlined" onClick={handleLogout} disabled={loggingOut}>
                          {loggingOut ? '로그아웃 중...' : '로그아웃'}
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/support')}>
                          1:1 문의하기
                        </Button>
                        <Button variant="text" onClick={() => navigate('/')} sx={{ px: 0 }}>
                          홈으로 이동
                        </Button>
                      </Stack>
                    </Paper>
                  </Stack>

                  <Divider />

                  {accountError && <Alert severity="error">{accountError}</Alert>}
                  {accountSuccess && (
                    <Alert severity="success" onClose={() => setAccountSuccess('')}>
                      {accountSuccess}
                    </Alert>
                  )}

                  {isUserAccount ? (
                    <Stack spacing={1}>
                      <Paper variant="outlined" sx={ITEM_SX}>
                        <Stack component="form" spacing={0.8} onSubmit={handleProfileSubmit}>
                          <Typography fontWeight={700}>회원정보 수정</Typography>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
                            <TextField
                              label="이름"
                              size="small"
                              value={profileForm.name}
                              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                              fullWidth
                              required
                            />
                            <TextField
                              label="연락처"
                              size="small"
                              placeholder="010-1234-5678"
                              value={profileForm.phone}
                              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                              fullWidth
                              required
                            />
                          </Stack>
                          <Button type="submit" variant="outlined" disabled={savingProfile} sx={{ alignSelf: 'flex-start' }}>
                            {savingProfile ? '저장 중...' : '회원정보 저장'}
                          </Button>
                        </Stack>
                      </Paper>

                      <Paper variant="outlined" sx={ITEM_SX}>
                        <Stack component="form" spacing={0.8} onSubmit={handlePasswordSubmit}>
                          <Typography fontWeight={700}>비밀번호 변경</Typography>
                          <TextField
                            type="password"
                            label="현재 비밀번호"
                            size="small"
                            value={passwordForm.currentPassword}
                            onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                            fullWidth
                            required
                          />
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
                            <TextField
                              type="password"
                              label="새 비밀번호"
                              size="small"
                              value={passwordForm.newPassword}
                              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                              fullWidth
                              required
                            />
                            <TextField
                              type="password"
                              label="새 비밀번호 확인"
                              size="small"
                              value={passwordForm.confirmPassword}
                              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                              fullWidth
                              required
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            새 비밀번호는 8~72자, 영문과 숫자를 각각 1자 이상 포함해야 합니다.
                          </Typography>
                          <Button type="submit" variant="outlined" disabled={savingPassword} sx={{ alignSelf: 'flex-start' }}>
                            {savingPassword ? '변경 중...' : '비밀번호 변경'}
                          </Button>
                        </Stack>
                      </Paper>
                    </Stack>
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      일반 사용자 계정에서 계정 수정 기능을 사용할 수 있습니다.
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  )
}

export default MyPagePage
