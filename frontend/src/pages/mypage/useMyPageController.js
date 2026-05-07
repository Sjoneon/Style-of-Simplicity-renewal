import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getApiErrorMessage } from '../../services/api'
import { fetchMyInquiries } from '../../services/inquiryApi'
import { fetchMyOrders } from '../../services/orderApi'
import { createMyReview, fetchMyReviews } from '../../services/reviewApi'
import { changeMyPassword, fetchMyRecentProducts, updateMyAddress, updateMyProfile } from '../../services/userApi'
import { fetchMyWishlist, removeFromWishlist } from '../../services/wishlistApi'
import { openKakaoPostcode } from '../../utils/loadKakaoPostcode'
import {
  EMPTY_ADDRESS_FORM,
  EMPTY_PASSWORD_FORM,
  EMPTY_PROFILE_FORM,
  EMPTY_REVIEW_FORM,
} from './myPageConfig'
import {
  composeAddressValue,
  normalizeInquiries,
  normalizeOrders,
  normalizeRecentViewed,
  normalizeReviews,
  normalizeWishlist,
  parseAddressValue,
} from './myPageUtils'

export default function useMyPageController() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, authLoading, refreshSession, logout } = useAuth()
  const redirectingRef = useRef(false)

  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [recentViewedItems, setRecentViewedItems] = useState([])
  const [reviews, setReviews] = useState([])

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

  const [savingReview, setSavingReview] = useState(false)
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [expandedSection, setExpandedSection] = useState(false)

  const isUserAccount = user?.userType === 'user'
  const isSellerAccount = user?.userType === 'seller'

  const moveToLogin = useCallback(() => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`, { replace: true })
  }, [location.pathname, location.search, navigate])

  const handleUnauthorized = useCallback(async (err) => {
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
    setRecentViewedItems([])
    setReviews([])
    setReviewError('')
    setReviewSuccess('')

    await refreshSession()
    moveToLogin()
    return true
  }, [moveToLogin, refreshSession])

  const loadMyPageData = useCallback(async () => {
    if (!isUserAccount) {
      setOrders([])
      setInquiries([])
      setWishlistItems([])
      setRecentViewedItems([])
      setReviews([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const [orderResponse, inquiryList, wishlistResponse, recentProductsResponse, reviewResponse] = await Promise.all([
        fetchMyOrders(),
        fetchMyInquiries(),
        fetchMyWishlist(),
        fetchMyRecentProducts(),
        fetchMyReviews(),
      ])

      setOrders(normalizeOrders(orderResponse.data))
      setInquiries(normalizeInquiries(inquiryList))
      setWishlistItems(normalizeWishlist(wishlistResponse.data))
      setRecentViewedItems(normalizeRecentViewed(recentProductsResponse.data))
      setReviews(normalizeReviews(reviewResponse.data))
    } catch (err) {
      if (!(await handleUnauthorized(err))) {
        setError(getApiErrorMessage(err, '마이페이지 정보를 불러오지 못했습니다.'))
      }
      setOrders([])
      setInquiries([])
      setWishlistItems([])
      setRecentViewedItems([])
      setReviews([])
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
      setReviewForm(EMPTY_REVIEW_FORM)
      setReviewError('')
      setReviewSuccess('')
      return
    }

    setProfileForm({ name: String(user.name || ''), phone: String(user.phone || '') })
    setAddressForm({ ...parseAddressValue(user.address) })
    setPasswordForm(EMPTY_PASSWORD_FORM)
    setReviewForm(EMPTY_REVIEW_FORM)
    setReviewError('')
    setReviewSuccess('')
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
    return {
      total: inquiries.length,
      pending,
      answered: Math.max(0, inquiries.length - pending),
    }
  }, [inquiries])

  const recentInquiries = useMemo(() => inquiries.slice(0, 3), [inquiries])
  const recentReviews = useMemo(() => reviews.slice(0, 5), [reviews])

  const reviewSummary = useMemo(() => {
    const total = reviews.length
    if (total === 0) {
      return { total: 0, average: 0 }
    }
    const ratingSum = reviews.reduce((acc, review) => acc + Number(review?.rating || 0), 0)
    return { total, average: ratingSum / total }
  }, [reviews])

  const reviewableOrders = useMemo(() => {
    if (!isUserAccount) {
      return []
    }

    const reviewedOrderIds = new Set(
      reviews.map((review) => Number(review?.orderId)).filter((orderId) => Number.isFinite(orderId) && orderId > 0),
    )

    return orders
      .filter((order) => {
        const orderId = Number(order?.id)
        const status = String(order?.status || '').toUpperCase()
        if (!Number.isFinite(orderId) || orderId <= 0) return false
        if (reviewedOrderIds.has(orderId)) return false
        if (status === 'CANCELLED') return false
        return true
      })
      .map((order) => ({
        id: order.id,
        label: `#${order.id} ${order.productName || '상품명 없음'}`,
      }))
  }, [isUserAccount, orders, reviews])

  const resolvedAddressValue = useMemo(() => composeAddressValue(addressForm), [addressForm])

  const toggleSection = useCallback((section) => {
    setExpandedSection((prev) => (prev === section ? false : section))
  }, [])

  const handleRemoveWishlist = useCallback(async (productId) => {
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
      if (!(await handleUnauthorized(err))) {
        setError(getApiErrorMessage(err, '찜 해제에 실패했습니다.'))
      }
    } finally {
      setRemovingWishlistProductId(null)
    }
  }, [handleUnauthorized, isUserAccount])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/')
    } finally {
      setLoggingOut(false)
    }
  }, [logout, navigate])

  const handleProfileSubmit = useCallback(async (event) => {
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
      if (!(await handleUnauthorized(err))) {
        setAccountError(getApiErrorMessage(err, '회원정보 수정에 실패했습니다.'))
      }
    } finally {
      setSavingProfile(false)
    }
  }, [addressForm, handleUnauthorized, isUserAccount, profileForm.name, profileForm.phone, refreshSession, user?.address])

  const handleAddressSubmit = useCallback(async (event) => {
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
      if (!(await handleUnauthorized(err))) {
        setAccountError(getApiErrorMessage(err, '배송지 수정에 실패했습니다.'))
      }
    } finally {
      setSavingAddress(false)
    }
  }, [addressForm, handleUnauthorized, isUserAccount, refreshSession])

  const handleOpenAddressSearch = useCallback(async () => {
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
  }, [])

  const handlePasswordSubmit = useCallback(async (event) => {
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
      if (!(await handleUnauthorized(err))) {
        setAccountError(getApiErrorMessage(err, '비밀번호 변경에 실패했습니다.'))
      }
    } finally {
      setSavingPassword(false)
    }
  }, [handleUnauthorized, isUserAccount, moveToLogin, passwordForm, refreshSession])

  const handleReviewSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (!isUserAccount) {
      setReviewError('일반 사용자 계정만 리뷰를 작성할 수 있습니다.')
      return
    }

    const orderId = Number(reviewForm.orderId)
    const rating = Number(reviewForm.rating)
    const content = String(reviewForm.content || '').trim()

    if (!orderId) {
      setReviewError('리뷰를 작성할 주문을 선택해 주세요.')
      return
    }
    if (!rating || rating < 1 || rating > 5) {
      setReviewError('평점을 선택해 주세요.')
      return
    }
    if (!content) {
      setReviewError('리뷰 내용을 입력해 주세요.')
      return
    }

    setSavingReview(true)
    setReviewError('')
    setReviewSuccess('')
    setError('')

    try {
      const response = await createMyReview({ orderId, rating, content })
      const createdReview = response?.data

      if (createdReview) {
        setReviews((previous) =>
          normalizeReviews([
            createdReview,
            ...previous.filter((review) => Number(review?.orderId) !== Number(createdReview?.orderId)),
          ]),
        )
      } else {
        await loadMyPageData()
      }

      setReviewForm(EMPTY_REVIEW_FORM)
      setReviewSuccess('리뷰를 등록했습니다.')
    } catch (err) {
      if (!(await handleUnauthorized(err))) {
        setReviewError(getApiErrorMessage(err, '리뷰 등록에 실패했습니다.'))
      }
    } finally {
      setSavingReview(false)
    }
  }, [handleUnauthorized, isUserAccount, loadMyPageData, reviewForm])

  return {
    auth: {
      user,
      authLoading,
      isUserAccount,
      isSellerAccount,
    },
    layout: {
      expandedSection,
      toggleSection,
    },
    orderView: {
      loading,
      error,
      statusFilter,
      setStatusFilter,
      visibleOrders,
      orderSummary,
      inquirySummary,
      recentInquiries,
    },
    interestView: {
      wishlistItems,
      recentViewedItems,
      removingWishlistProductId,
    },
    reviewView: {
      reviewSummary,
      reviewableOrders,
      recentReviews,
      reviewForm,
      setReviewForm,
      savingReview,
      reviewError,
      setReviewError,
      reviewSuccess,
      setReviewSuccess,
    },
    accountView: {
      profileForm,
      setProfileForm,
      addressForm,
      setAddressForm,
      resolvedAddressValue,
      passwordForm,
      setPasswordForm,
      accountError,
      accountSuccess,
      setAccountSuccess,
      savingProfile,
      savingAddress,
      openingAddressSearch,
      savingPassword,
    },
    actions: {
      loggingOut,
      handleLogout,
      loadMyPageData,
      handleRemoveWishlist,
      handleReviewSubmit,
      handleAddressSubmit,
      handleOpenAddressSearch,
      handleProfileSubmit,
      handlePasswordSubmit,
      moveToLogin,
      navigate,
    },
  }
}
