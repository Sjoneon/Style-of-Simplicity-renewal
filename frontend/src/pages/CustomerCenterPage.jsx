import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { createInquiry, deleteInquiry, fetchMyInquiries } from '../services/inquiryApi'
import { fetchProducts } from '../services/productApi'

const EMPTY_FORM = {
  title: '',
  content: '',
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return String(value).replace('T', ' ').slice(0, 16)
}

function parseLinkedProductContext(search) {
  const params = new URLSearchParams(search)
  const rawProductId = params.get('productId')
  const productName = String(params.get('productName') || '').trim()

  if (!rawProductId) {
    return { productId: null, productName, hasInvalidProductId: false }
  }

  const parsedId = Number(rawProductId)
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return { productId: null, productName, hasInvalidProductId: true }
  }

  return { productId: parsedId, productName, hasInvalidProductId: false }
}

function CustomerCenterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, authLoading, refreshSession } = useAuth()
  const redirectingRef = useRef(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [inquiries, setInquiries] = useState([])
  const [productNameById, setProductNameById] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingInquiryId, setDeletingInquiryId] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const canUseSupport = user?.userType === 'user'

  const linkedProductContext = useMemo(
    () => parseLinkedProductContext(location.search),
    [location.search],
  )
  const linkedProductId = linkedProductContext.productId
  const hasInvalidProductId = linkedProductContext.hasInvalidProductId

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
      setInquiries([])
      setSuccessMessage('')

      await refreshSession()
      moveToLogin()
      return true
    },
    [moveToLogin, refreshSession],
  )

  const loadProductCatalog = useCallback(async () => {
    try {
      const response = await fetchProducts()
      const list = Array.isArray(response.data) ? response.data : []
      const nextMap = {}
      list.forEach((product) => {
        const id = Number(product?.id)
        const name = String(product?.name || '').trim()
        if (Number.isInteger(id) && id > 0 && name) {
          nextMap[id] = name
        }
      })
      setProductNameById(nextMap)
    } catch {
      setProductNameById({})
    }
  }, [])

  const loadMyInquiries = useCallback(async () => {
    if (!canUseSupport) {
      setInquiries([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const list = await fetchMyInquiries()
      setInquiries(Array.isArray(list) ? list : [])
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setError(getApiErrorMessage(err, '내 문의 목록을 불러오지 못했습니다.'))
      }
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }, [canUseSupport, handleUnauthorized])

  useEffect(() => {
    if (!canUseSupport) {
      setProductNameById({})
      return
    }
    loadProductCatalog()
  }, [canUseSupport, loadProductCatalog])

  useEffect(() => {
    loadMyInquiries()
  }, [loadMyInquiries])

  const resolveProductName = useCallback(
    (productId, fallbackName = '') => {
      const safeFallback = String(fallbackName || '').trim()
      if (safeFallback) {
        return safeFallback
      }

      const numericId = Number(productId)
      if (!Number.isInteger(numericId) || numericId <= 0) {
        return '-'
      }
      return productNameById[numericId] || `상품 #${numericId}`
    },
    [productNameById],
  )

  const linkedProductName = useMemo(() => {
    if (!linkedProductId) {
      return ''
    }
    return resolveProductName(linkedProductId, linkedProductContext.productName)
  }, [linkedProductContext.productName, linkedProductId, resolveProductName])

  const visibleInquiries = useMemo(() => {
    return [...inquiries].sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')))
  }, [inquiries])

  const pendingCount = useMemo(() => {
    return inquiries.filter((inquiry) => !String(inquiry.answer || '').trim()).length
  }, [inquiries])

  const answeredCount = Math.max(0, inquiries.length - pendingCount)

  const resetForm = () => {
    setForm(EMPTY_FORM)
  }

  const clearLinkedProduct = () => {
    navigate('/support', { replace: true })
  }

  const handleCreateInquiry = async (event) => {
    event.preventDefault()

    if (!canUseSupport) {
      setError('일반 사용자 로그인 후 문의를 작성할 수 있습니다.')
      return
    }

    const title = String(form.title || '').trim()
    const content = String(form.content || '').trim()

    if (!title || !content) {
      setError('문의 제목과 내용을 입력해 주세요.')
      return
    }

    const payload = {
      title,
      content,
      ...(linkedProductId ? { productId: linkedProductId } : {}),
    }

    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      await createInquiry(payload)
      resetForm()
      await loadMyInquiries()
      setSuccessMessage('문의를 등록했습니다.')
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setError(getApiErrorMessage(err, '문의 등록에 실패했습니다.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInquiry = async (inquiryId) => {
    const confirmed = window.confirm('이 문의를 삭제하시겠습니까?')
    if (!confirmed) {
      return
    }

    setDeletingInquiryId(inquiryId)
    setError('')
    setSuccessMessage('')

    try {
      await deleteInquiry(inquiryId)
      await loadMyInquiries()
      setSuccessMessage('문의를 삭제했습니다.')
    } catch (err) {
      if (!await handleUnauthorized(err)) {
        setError(getApiErrorMessage(err, '문의 삭제에 실패했습니다.'))
      }
    } finally {
      setDeletingInquiryId(null)
    }
  }

  return (
    <Stack spacing={1.8}>
      <Paper
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#0f0f0f',
          minHeight: { xs: 170, md: 190 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.32) 100%)',
          }}
        />
        <Stack
          spacing={0.8}
          sx={{
            position: 'relative',
            zIndex: 1,
            color: '#ffffff',
            px: { xs: 2.2, md: 3.2 },
            py: { xs: 2.4, md: 3 },
          }}
        >
          <Typography variant="overline" sx={{ letterSpacing: 1.1, opacity: 0.84 }}>
            SOS RENEWAL SUPPORT
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            고객 문의 접수/확인
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.84 }}>
            일반 문의는 바로 작성할 수 있고, 상품 상세에서 이동하면 해당 상품 문의로 자동 연결됩니다.
          </Typography>
        </Stack>
      </Paper>

      {authLoading ? (
        <Paper sx={{ p: 2.6, borderRadius: 2.6, border: '1px solid', borderColor: 'divider' }}>
          <Stack alignItems="center" spacing={1}>
            <CircularProgress />
            <Typography color="text.secondary">세션을 확인하고 있습니다.</Typography>
          </Stack>
        </Paper>
      ) : !user ? (
        <Paper sx={{ p: 2.4, borderRadius: 2.6, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.1}>
            <Typography variant="h6" fontWeight={700}>
              로그인 후 이용 가능합니다
            </Typography>
            <Typography color="text.secondary">
              고객센터 문의 기능은 로그인 사용자 전용입니다. 로그인 페이지로 이동해 주세요.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={moveToLogin}>
                로그인하러 가기
              </Button>
              <Button color="inherit" onClick={() => navigate('/')}>
                홈으로
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : !canUseSupport ? (
        <Alert severity="warning" variant="outlined">
          고객센터 문의 작성/조회는 일반 사용자 계정에서만 사용할 수 있습니다.
        </Alert>
      ) : (
        <>
          {error && <Alert severity="error">{error}</Alert>}
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          {hasInvalidProductId && (
            <Alert severity="warning" variant="outlined">
              잘못된 상품 문의 경로입니다. 일반 문의로 작성하거나 상품 상세에서 다시 이동해 주세요.
            </Alert>
          )}
          {linkedProductId && (
            <Alert
              severity="info"
              variant="outlined"
              action={(
                <Button color="inherit" size="small" onClick={clearLinkedProduct}>
                  일반 문의로 전환
                </Button>
              )}
            >
              상품명: {linkedProductName}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="stretch">
            <Paper sx={{ p: 2, borderRadius: 2.6, border: '1px solid', borderColor: 'divider', flex: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1.1 }}>
                문의 작성
              </Typography>

              <Stack component="form" spacing={1.1} onSubmit={handleCreateInquiry}>
                <TextField
                  label="문의 제목"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  inputProps={{ maxLength: 120 }}
                  fullWidth
                  required
                />
                <TextField
                  label="문의 내용"
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                  multiline
                  minRows={4}
                  fullWidth
                  required
                />

                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={submitting}>
                    {submitting ? '등록 중...' : '문의 등록'}
                  </Button>
                  <Button type="button" color="inherit" onClick={resetForm} disabled={submitting}>
                    초기화
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 2.6, border: '1px solid', borderColor: 'divider', minWidth: { md: 240 } }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.1 }}>
                내 문의 현황
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                현재 로그인 계정 기준
              </Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={`전체 ${inquiries.length}건`} />
                <Chip size="small" variant="outlined" label={`답변 대기 ${pendingCount}건`} />
                <Chip size="small" variant="outlined" label={`답변 완료 ${answeredCount}건`} />
              </Stack>
            </Paper>
          </Stack>

          <Paper sx={{ p: 2, borderRadius: 2.6, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.1 }}>
              내 문의 목록
            </Typography>

            {loading ? (
              <Stack alignItems="center" sx={{ py: 4 }}>
                <CircularProgress />
              </Stack>
            ) : visibleInquiries.length === 0 ? (
              <Typography color="text.secondary">등록된 문의가 없습니다. 첫 문의를 남겨 보세요.</Typography>
            ) : (
              <Stack spacing={1.1}>
                {visibleInquiries.map((inquiry) => {
                  const hasAnswer = Boolean(String(inquiry.answer || '').trim())

                  return (
                    <Paper key={inquiry.id} variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
                      <Stack spacing={0.9}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          spacing={0.7}
                        >
                          <Typography fontWeight={700}>
                            #{inquiry.id} {inquiry.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(inquiry.createdDate)}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={hasAnswer ? 'success' : 'default'}
                            label={hasAnswer ? '답변 완료' : '답변 대기'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            상품명: {resolveProductName(inquiry.productId)}
                          </Typography>
                        </Stack>

                        <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.6 }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {inquiry.content}
                          </Typography>
                        </Paper>

                        {hasAnswer && (
                          <Paper
                            variant="outlined"
                            sx={{ p: 1.1, borderRadius: 1.6, borderColor: '#d9d9d9', bgcolor: '#fafafa' }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              답변
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.3, whiteSpace: 'pre-line' }}>
                              {inquiry.answer}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              답변일: {formatDateTime(inquiry.answeredDate)}
                            </Typography>
                          </Paper>
                        )}

                        <Stack direction="row" justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={deletingInquiryId === inquiry.id}
                            onClick={() => handleDeleteInquiry(inquiry.id)}
                          >
                            문의 삭제
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  )
                })}
              </Stack>
            )}
          </Paper>
        </>
      )}
    </Stack>
  )
}

export default CustomerCenterPage
