import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import { composeAddressValue, parseAddressValue } from './mypage/myPageUtils'
import resolveImageUrl from '../utils/resolveImageUrl'
import { openKakaoPostcode } from '../utils/loadKakaoPostcode'
import { openTossPaymentWindow } from '../utils/tossPaymentsSdk'
import { buildCheckoutOrderId, savePendingCheckout } from './checkout/checkoutStorage'

const DELIVERY_REQUEST_OPTIONS = [
  { value: 'DOOR', label: '문 앞에 놔주세요' },
  { value: 'GUARD', label: '경비실에 맡겨주세요' },
  { value: 'BOX', label: '택배함에 넣어주세요' },
  { value: 'CALL', label: '배송 전에 연락 주세요' },
  { value: 'CUSTOM', label: '직접입력' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'TOSSPAY', label: '토스페이' },
  { value: 'KAKAOPAY', label: '카카오페이' },
  { value: 'PAYCO', label: '페이코' },
  { value: 'CARD', label: '신용/체크카드' },
  { value: 'ETC', label: '기타 결제' },
]

function buildOrderName(orderItems) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return 'SOS 주문'
  }
  if (orderItems.length === 1) {
    return String(orderItems[0]?.name || 'SOS 주문')
  }
  return `${String(orderItems[0]?.name || 'SOS 주문')} 외 ${orderItems.length - 1}건`
}

function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const checkoutState = location.state || {}

  const mode = String(checkoutState.mode || '')
  const orderItems = useMemo(
    () => (Array.isArray(checkoutState.orderItems) ? checkoutState.orderItems : []),
    [checkoutState.orderItems],
  )
  const totalAmount = Number.isFinite(Number(checkoutState.totalAmount))
    ? Number(checkoutState.totalAmount)
    : orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)

  const isValidCheckoutContext =
    (mode === 'product' && Number(checkoutState.productId) > 0 && orderItems.length > 0)
    || (mode === 'cart' && orderItems.length > 0)

  const [receiverName, setReceiverName] = useState(String(user?.name || '').trim())
  const [receiverPhone, setReceiverPhone] = useState(String(user?.phone || '').trim())
  const [addressForm, setAddressForm] = useState(() => parseAddressValue(user?.address))
  const [deliveryRequestType, setDeliveryRequestType] = useState('DOOR')
  const [customDeliveryRequest, setCustomDeliveryRequest] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TOSSPAY')
  const [agreed, setAgreed] = useState(false)
  const [openingAddressSearch, setOpeningAddressSearch] = useState(false)
  const [requestingPayment, setRequestingPayment] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const resolvedAddressValue = useMemo(() => composeAddressValue(addressForm), [addressForm])
  const totalQuantity = useMemo(
    () => orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [orderItems],
  )
  const expectedReward = useMemo(() => Math.floor(totalAmount * 0.01), [totalAmount])
  const selectedRequest = useMemo(() => {
    if (deliveryRequestType === 'CUSTOM') return String(customDeliveryRequest || '').trim()
    return DELIVERY_REQUEST_OPTIONS.find((item) => item.value === deliveryRequestType)?.label || ''
  }, [customDeliveryRequest, deliveryRequestType])

  const handleOpenAddressSearch = async () => {
    setOpeningAddressSearch(true)
    setError('')
    try {
      await openKakaoPostcode(({ postcode, address }) => {
        setAddressForm((prev) => ({
          ...prev,
          postcode: String(postcode || '').trim(),
          address: String(address || '').trim(),
        }))
      })
    } catch (err) {
      setError(getApiErrorMessage(err, '주소 검색을 열지 못했습니다.'))
    } finally {
      setOpeningAddressSearch(false)
    }
  }

  const validateCheckout = () => {
    if (!isValidCheckoutContext) {
      return '주문 정보가 유효하지 않습니다. 상품 페이지에서 다시 시도해 주세요.'
    }
    if (!receiverName) {
      return '수령인을 입력해 주세요.'
    }
    if (!receiverPhone || String(receiverPhone).replace(/\D/g, '').length < 8) {
      return '연락처를 정확히 입력해 주세요.'
    }
    if (!resolvedAddressValue) {
      return '배송지를 입력해 주세요.'
    }
    if (deliveryRequestType === 'CUSTOM' && String(customDeliveryRequest || '').trim().length === 0) {
      return '배송 요청사항을 입력해 주세요.'
    }
    if (String(customDeliveryRequest || '').length > 50) {
      return '배송 요청사항은 50자 이내로 입력해 주세요.'
    }
    if (!paymentMethod) {
      return '결제 수단을 선택해 주세요.'
    }
    if (!agreed) {
      return '주문 내용을 확인하고 결제 동의에 체크해 주세요.'
    }
    return ''
  }

  const handleRequestPayment = async () => {
    const validationError = validateCheckout()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!user || user.userType !== 'user') {
      setError('사용자 로그인이 필요합니다.')
      navigate('/auth')
      return
    }

    const clientKey = String(import.meta.env.VITE_TOSS_CLIENT_KEY || '').trim()
    if (!clientKey) {
      setError('VITE_TOSS_CLIENT_KEY가 설정되지 않았습니다. 프론트 환경변수를 확인해 주세요.')
      return
    }

    setRequestingPayment(true)
    setError('')

    try {
      const orderId = buildCheckoutOrderId()
      const orderName = buildOrderName(orderItems)
      const successUrl = `${window.location.origin}/checkout/toss/success`
      const failUrl = `${window.location.origin}/checkout/toss/fail`

      // 결제 성공 콜백에서 주문을 이어가기 위한 최소 상태를 세션에 저장한다.
      savePendingCheckout(orderId, {
        mode,
        productId: checkoutState.productId || null,
        optionId: checkoutState.optionId || null,
        orderItems,
        totalAmount,
        receiverName,
        receiverPhone,
        address: resolvedAddressValue,
        deliveryRequest: selectedRequest,
        paymentMethod,
      })

      await openTossPaymentWindow({
        clientKey,
        customerKey: `user_${user.id}`,
        amount: totalAmount,
        orderId,
        orderName,
        successUrl,
        failUrl,
        customerEmail: String(user.email || ''),
        customerName: receiverName,
      })
    } catch (err) {
      setError(getApiErrorMessage(err, '토스 결제창을 열지 못했습니다.'))
    } finally {
      setRequestingPayment(false)
    }
  }

  if (!isValidCheckoutContext) {
    return (
      <Stack spacing={1.5}>
        <Alert severity="warning">주문 정보가 없습니다. 상품 또는 장바구니에서 다시 진행해 주세요.</Alert>
        <Button variant="contained" onClick={() => navigate('/')}>홈으로 이동</Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>주문서</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
        <Stack spacing={2} sx={{ flex: 1.6, width: '100%' }}>
          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Typography variant="h6" fontWeight={800}>수령인</Typography>
                <Chip size="small" label="기본 배송지" variant="outlined" />
              </Stack>
              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenAddressSearch}
                disabled={openingAddressSearch}
              >
                배송지 변경
              </Button>
            </Stack>

            <Stack spacing={1}>
              <TextField
                label="수령인"
                value={receiverName}
                onChange={(event) => setReceiverName(event.target.value)}
                size="small"
              />
              <TextField
                label="연락처"
                value={receiverPhone}
                onChange={(event) => setReceiverPhone(event.target.value)}
                size="small"
              />
              <TextField
                label="우편번호"
                value={addressForm.postcode}
                size="small"
                disabled
              />
              <TextField
                label="기본 주소"
                value={addressForm.address}
                size="small"
                disabled
              />
              <TextField
                label="상세 주소"
                value={addressForm.detailAddress}
                onChange={(event) => setAddressForm((prev) => ({ ...prev, detailAddress: event.target.value }))}
                size="small"
              />

              <TextField
                select
                label="배송 요청사항"
                value={deliveryRequestType}
                onChange={(event) => setDeliveryRequestType(event.target.value)}
                size="small"
              >
                {DELIVERY_REQUEST_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
              {deliveryRequestType === 'CUSTOM' && (
                <TextField
                  value={customDeliveryRequest}
                  onChange={(event) => setCustomDeliveryRequest(event.target.value.slice(0, 50))}
                  placeholder="최대 50자까지 입력 가능합니다."
                  size="small"
                  fullWidth
                />
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
              주문 상품 {orderItems.length}개
            </Typography>
            <Stack spacing={1.2}>
              {orderItems.map((item, index) => (
                <Stack key={`${item.id || 'item'}-${index}`} direction="row" spacing={1.2} alignItems="flex-start">
                  <Box
                    component="img"
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.name}
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      objectFit: 'cover',
                      display: 'block',
                      bgcolor: 'grey.100',
                    }}
                  />
                  <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      {String(item.brandName || 'SOS')}
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.selectedSizeLabel ? `${item.selectedSizeLabel} / ` : ''}{Number(item.quantity || 0)}개
                    </Typography>
                    <Typography variant="body1" fontWeight={800}>
                      {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('ko-KR')}원
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
              결제 수단
            </Typography>
            <RadioGroup value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <FormControlLabel key={method.value} value={method.value} control={<Radio />} label={method.label} />
              ))}
            </RadioGroup>
            <Typography variant="caption" color="text.secondary">
              테스트 환경에서는 토스페이먼츠 테스트 키로 결제창이 실행되며 실제 청구는 발생하지 않습니다.
            </Typography>
            <Divider sx={{ my: 1.2 }} />
            <FormControlLabel
              control={<Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />}
              label="주문 내용을 확인했으며 결제 진행에 동의합니다."
            />
          </Paper>
        </Stack>

        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            width: '100%',
            maxWidth: { xs: '100%', lg: 360 },
            position: { lg: 'sticky' },
            top: { lg: 96 },
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.2 }}>
            결제 금액
          </Typography>
          <Stack spacing={0.8}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">상품 금액</Typography>
              <Typography>{totalAmount.toLocaleString('ko-KR')}원</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">배송비</Typography>
              <Typography color="primary.main" fontWeight={700}>무료배송</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="subtitle1" fontWeight={700}>총 결제 금액</Typography>
              <Typography variant="h6" fontWeight={800}>
                {totalAmount.toLocaleString('ko-KR')}원
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">예상 적립</Typography>
              <Typography>{expectedReward.toLocaleString('ko-KR')}원</Typography>
            </Stack>
            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              결제 모드: 토스 테스트 결제{'\n'}
              배송 요청: {selectedRequest || '-'}{'\n'}
              주문 수량: 총 {totalQuantity}개
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 1, py: 1.2, bgcolor: '#111111', '&:hover': { bgcolor: '#000000' } }}
              onClick={handleRequestPayment}
              disabled={requestingPayment}
            >
              {requestingPayment ? '결제창 준비 중...' : `${totalAmount.toLocaleString('ko-KR')}원 결제하기`}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2200}
        onClose={() => setToastMessage('')}
        message={toastMessage}
      />
    </Stack>
  )
}

export default CheckoutPage
