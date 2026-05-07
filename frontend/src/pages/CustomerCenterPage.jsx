import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import {
  createInquiry,
  DEFAULT_INQUIRY_CATEGORY,
  deleteInquiry,
  fetchMyInquiries,
  getInquiryCategoryLabel,
  INQUIRY_CATEGORY_OPTIONS,
  normalizeInquiryCategory,
} from '../services/inquiryApi'
import { fetchProducts } from '../services/productApi'
import resolveImageUrl from '../utils/resolveImageUrl'

const INQUIRY_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024
const INQUIRY_IMAGE_MIN_WIDTH = 200
const INQUIRY_IMAGE_MIN_HEIGHT = 200
const INQUIRY_IMAGE_MAX_WIDTH = 6000
const INQUIRY_IMAGE_MAX_HEIGHT = 6000
const INQUIRY_ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const INQUIRY_NOTICE_LINES = [
  '제품 사용, 오염, 전용 박스 손상, 라벨 제거, 사은품 및 부속 사용/분실 시, 교환/환불이 불가능 합니다.',
  '교환을 원하시는 상품(사이즈)의 재고가 부족 시, 교환은 불가하지만 환불을 가능 합니다.',
]

function createEmptyForm(defaultCategory = DEFAULT_INQUIRY_CATEGORY) {
  return {
    title: '',
    content: '',
    category: defaultCategory,
    imageFile: null,
  }
}

const EMPTY_FORM = createEmptyForm()

function formatBytes(bytes) {
  const value = Number(bytes || 0)
  if (!Number.isFinite(value) || value <= 0) {
    return '0MB'
  }
  return `${(value / (1024 * 1024)).toFixed(1)}MB`
}

async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      resolve({ width: image.width, height: image.height })
      URL.revokeObjectURL(objectUrl)
    }

    image.onerror = () => {
      reject(new Error('이미지 미리보기를 읽을 수 없습니다.'))
      URL.revokeObjectURL(objectUrl)
    }

    image.src = objectUrl
  })
}

async function validateInquiryImageFile(file) {
  if (!file) {
    return null
  }

  // 프론트에서 먼저 막아 사용자 재시도 시간을 줄이고, 서버에서도 동일 기준으로 한 번 더 검증한다.
  if (!INQUIRY_ALLOWED_IMAGE_MIME_TYPES.includes(String(file.type || '').toLowerCase())) {
    return 'PNG/JPG/WEBP/GIF 이미지 파일만 첨부할 수 있습니다.'
  }

  if (Number(file.size || 0) > INQUIRY_IMAGE_MAX_SIZE_BYTES) {
    return `문의 이미지는 ${formatBytes(INQUIRY_IMAGE_MAX_SIZE_BYTES)} 이하만 업로드할 수 있습니다.`
  }

  try {
    const { width, height } = await getImageDimensions(file)
    if (width < INQUIRY_IMAGE_MIN_WIDTH || height < INQUIRY_IMAGE_MIN_HEIGHT) {
      return `이미지 해상도는 최소 ${INQUIRY_IMAGE_MIN_WIDTH}x${INQUIRY_IMAGE_MIN_HEIGHT}px 이상이어야 합니다.`
    }
    if (width > INQUIRY_IMAGE_MAX_WIDTH || height > INQUIRY_IMAGE_MAX_HEIGHT) {
      return `이미지 해상도는 최대 ${INQUIRY_IMAGE_MAX_WIDTH}x${INQUIRY_IMAGE_MAX_HEIGHT}px 이하여야 합니다.`
    }
  } catch (error) {
    return error.message || '이미지 파일 확인 중 오류가 발생했습니다.'
  }

  return null
}

function createPreviewUrl(file) {
  if (!file) {
    return ''
  }
  return URL.createObjectURL(file)
}

const INQUIRY_STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '답변 대기' },
  { value: 'ANSWERED', label: '답변 완료' },
]

const INQUIRY_CATEGORY_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  ...INQUIRY_CATEGORY_OPTIONS,
]

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
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [noticeConfirmed, setNoticeConfirmed] = useState(false)
  const [inquiries, setInquiries] = useState([])
  const [productNameById, setProductNameById] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingInquiryId, setDeletingInquiryId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
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

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    setForm((prev) => {
      if (String(prev.title || '').trim() || String(prev.content || '').trim() || prev.imageFile) {
        return prev
      }

      const nextCategory = linkedProductId ? 'PRODUCT_CHECK' : DEFAULT_INQUIRY_CATEGORY
      if (normalizeInquiryCategory(prev.category) === nextCategory) {
        return prev
      }
      return {
        ...prev,
        category: nextCategory,
      }
    })
  }, [linkedProductId])

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
    const sorted = [...inquiries].sort((a, b) => String(b.createdDate || '').localeCompare(String(a.createdDate || '')))
    // 문의 상태/카테고리 필터를 함께 적용해 소비자가 원하는 문의만 빠르게 찾도록 한다.
    return sorted.filter((inquiry) => {
      const normalizedCategory = normalizeInquiryCategory(inquiry.category)
      const hasAnswer = Boolean(String(inquiry.answer || '').trim())

      const matchesCategory = categoryFilter === 'ALL' || normalizedCategory === categoryFilter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && !hasAnswer) ||
        (statusFilter === 'ANSWERED' && hasAnswer)

      return matchesCategory && matchesStatus
    })
  }, [categoryFilter, inquiries, statusFilter])

  const pendingCount = useMemo(() => {
    return inquiries.filter((inquiry) => !String(inquiry.answer || '').trim()).length
  }, [inquiries])

  const answeredCount = Math.max(0, inquiries.length - pendingCount)

  const resetForm = useCallback(() => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl('')
    setNoticeConfirmed(false)
    setForm(createEmptyForm(linkedProductId ? 'PRODUCT_CHECK' : DEFAULT_INQUIRY_CATEGORY))
  }, [imagePreviewUrl, linkedProductId])

  const handleCategorySelect = (nextCategory) => {
    setForm((prev) => ({
      ...prev,
      category: normalizeInquiryCategory(nextCategory),
    }))
  }

  const handleImageChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    const validationMessage = await validateInquiryImageFile(selectedFile)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }

    const previewUrl = createPreviewUrl(selectedFile)
    setImagePreviewUrl(previewUrl)
    setForm((prev) => ({
      ...prev,
      imageFile: selectedFile,
    }))
  }

  const clearSelectedImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl('')
    setForm((prev) => ({
      ...prev,
      imageFile: null,
    }))
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
    if (!noticeConfirmed) {
      setError('교환/환불 주의사항 확인 후 문의를 등록해 주세요.')
      return
    }

    const imageValidationMessage = await validateInquiryImageFile(form.imageFile)
    if (imageValidationMessage) {
      setError(imageValidationMessage)
      return
    }

    const payload = {
      title,
      content,
      category: normalizeInquiryCategory(form.category),
      imageFile: form.imageFile || null,
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
                <Stack spacing={0.8}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    문의 카테고리
                  </Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {INQUIRY_CATEGORY_OPTIONS.map((option) => {
                      const selected = normalizeInquiryCategory(form.category) === option.value
                      return (
                        <Button
                          key={`inquiry-category-${option.value}`}
                          type="button"
                          size="small"
                          variant={selected ? 'contained' : 'outlined'}
                          color={selected ? 'primary' : 'inherit'}
                          onClick={() => handleCategorySelect(option.value)}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </Stack>
                </Stack>

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

                <Alert severity="warning" variant="outlined">
                  {INQUIRY_NOTICE_LINES.map((line, index) => (
                    <Typography key={`notice-${index}`} variant="body2">
                      {line}
                    </Typography>
                  ))}
                </Alert>

                <Stack spacing={0.6}>
                  <Button component="label" type="button" variant="outlined" sx={{ width: 'fit-content' }}>
                    문의 이미지 선택(선택)
                    <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange} />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    허용 형식: PNG/JPG/WEBP/GIF · 용량: 최대 {formatBytes(INQUIRY_IMAGE_MAX_SIZE_BYTES)} · 해상도: {INQUIRY_IMAGE_MIN_WIDTH}x{INQUIRY_IMAGE_MIN_HEIGHT}px ~ {INQUIRY_IMAGE_MAX_WIDTH}x{INQUIRY_IMAGE_MAX_HEIGHT}px
                  </Typography>
                  {form.imageFile && (
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                      <Typography variant="body2">
                        첨부 파일: {form.imageFile.name} ({formatBytes(form.imageFile.size)})
                      </Typography>
                      <Button type="button" size="small" color="inherit" onClick={clearSelectedImage}>
                        이미지 제거
                      </Button>
                    </Stack>
                  )}
                  {imagePreviewUrl && (
                    <Box
                      component="img"
                      src={imagePreviewUrl}
                      alt="문의 첨부 미리보기"
                      sx={{
                        width: 180,
                        maxWidth: '100%',
                        borderRadius: 1.6,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  )}
                </Stack>

                <FormControlLabel
                  control={(
                    <Switch
                      checked={noticeConfirmed}
                      onChange={(event) => setNoticeConfirmed(event.target.checked)}
                    />
                  )}
                  label="교환/환불 주의사항을 확인했습니다."
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

              <Stack spacing={0.8} sx={{ mt: 1.2 }}>
                <TextField
                  select
                  size="small"
                  label="상태 필터"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {INQUIRY_STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={`status-filter-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="카테고리 필터"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  {INQUIRY_CATEGORY_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={`category-filter-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
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
                {visibleInquiries.map((inquiry, index) => {
                  const hasAnswer = Boolean(String(inquiry.answer || '').trim())
                  const displayOrder = index + 1

                  return (
                    <Paper key={inquiry.id} variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
                      <Stack spacing={0.9}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          justifyContent="space-between"
                          spacing={0.7}
                        >
                          <Typography fontWeight={700}>
                            내 문의 {displayOrder} {inquiry.title}
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
                          <Chip
                            size="small"
                            variant="outlined"
                            color="primary"
                            label={getInquiryCategoryLabel(inquiry.category)}
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

                        {inquiry.imageUrl && (
                          <Stack spacing={0.6}>
                            <Typography variant="caption" color="text.secondary">
                              첨부 이미지
                            </Typography>
                            <Box
                              component="img"
                              src={resolveImageUrl(inquiry.imageUrl)}
                              alt={`문의 ${displayOrder} 첨부 이미지`}
                              sx={{
                                width: 180,
                                maxWidth: '100%',
                                borderRadius: 1.6,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                          </Stack>
                        )}

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
