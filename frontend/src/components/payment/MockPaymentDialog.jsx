import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatCardNumber(value) {
  const digits = onlyDigits(value).slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4)
  if (digits.length < 3) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function maskCardNumber(value) {
  const digits = onlyDigits(value)
  if (digits.length < 8) return '**** **** **** ****'
  return `**** **** **** ${digits.slice(-4)}`
}

function detectCardCompany(value) {
  const digits = onlyDigits(value)
  if (digits.startsWith('4')) return 'VISA'
  if (digits.startsWith('5')) return 'MASTERCARD'
  if (digits.startsWith('3')) return 'AMEX'
  return 'TEST_CARD'
}

function validateMockPayment(form) {
  const holder = String(form.cardHolder || '').trim()
  const cardNumber = onlyDigits(form.cardNumber)
  const expiry = String(form.expiry || '').trim()
  const cvc = onlyDigits(form.cvc)

  if (!holder) {
    return '카드 소유자 이름을 입력해 주세요.'
  }
  if (cardNumber.length !== 16) {
    return '카드 번호 16자리를 입력해 주세요.'
  }

  // 테스트 결제 안전장치: 데모 카드 패턴만 허용한다.
  const allowedTestCards = new Set(['4242424242424242', '5555555555554444', '4000000000000002'])
  if (!allowedTestCards.has(cardNumber)) {
    return '테스트 결제는 데모 카드 번호만 사용할 수 있습니다. (예: 4242 4242 4242 4242)'
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return '유효기간은 MM/YY 형식으로 입력해 주세요.'
  }

  const [mm, yy] = expiry.split('/').map((part) => Number(part))
  if (!Number.isInteger(mm) || mm < 1 || mm > 12 || !Number.isInteger(yy)) {
    return '유효기간을 다시 확인해 주세요.'
  }

  const now = new Date()
  const currentYY = Number(String(now.getFullYear()).slice(-2))
  const currentMM = now.getMonth() + 1
  if (yy < currentYY || (yy === currentYY && mm < currentMM)) {
    return '만료된 카드입니다.'
  }

  if (cvc.length < 3 || cvc.length > 4) {
    return 'CVC는 3~4자리로 입력해 주세요.'
  }

  if (!form.agreed) {
    return '테스트 결제 유의사항에 동의해 주세요.'
  }

  return ''
}

function buildMockPaymentProof(form) {
  const cardNumber = onlyDigits(form.cardNumber)
  return {
    paymentMode: 'MOCK',
    transactionId: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    approvedAt: new Date().toISOString(),
    maskedCardNumber: maskCardNumber(cardNumber),
    cardCompany: detectCardCompany(cardNumber),
    cardHolderName: String(form.cardHolder || '').trim(),
  }
}

function MockPaymentDialog({
  open,
  onClose,
  onConfirm,
  submitting,
  orderTitle,
  orderItems,
  totalAmount,
}) {
  const [form, setForm] = useState({
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    agreed: false,
  })
  const [localError, setLocalError] = useState('')

  const resetSensitiveForm = () => {
    setForm({
      cardHolder: '',
      cardNumber: '',
      expiry: '',
      cvc: '',
      agreed: false,
    })
    setLocalError('')
  }

  const canSubmit = useMemo(() => !submitting, [submitting])

  const handleConfirm = async () => {
    const errorMessage = validateMockPayment(form)
    if (errorMessage) {
      setLocalError(errorMessage)
      return
    }

    setLocalError('')
    const paymentProof = buildMockPaymentProof(form)
    try {
      await onConfirm(paymentProof)
    } catch (err) {
      setLocalError(err?.message || '테스트 결제 처리에 실패했습니다.')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      TransitionProps={{ onExited: resetSensitiveForm }}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        테스트 결제
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
          실청구 없음 · 외부 PG 호출 없음
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 2.2 }}>
        <Stack spacing={1.4}>
          <Paper variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              주문 요약
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
              {orderTitle}
            </Typography>
            {Array.isArray(orderItems) && orderItems.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {orderItems.slice(0, 4).map((item, index) => (
                  <Typography key={`${item.name}-${index}`} variant="caption" color="text.secondary">
                    · {item.name} {item.quantity ? `x ${item.quantity}` : ''}
                  </Typography>
                ))}
                {orderItems.length > 4 && (
                  <Typography variant="caption" color="text.secondary">
                    외 {orderItems.length - 4}건
                  </Typography>
                )}
              </Stack>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" fontWeight={800}>
              {Number(totalAmount || 0).toLocaleString('ko-KR')}원
            </Typography>
          </Paper>

          {localError && <Alert severity="error">{localError}</Alert>}

          <TextField
            label="카드 소유자"
            value={form.cardHolder}
            onChange={(event) => setForm((prev) => ({ ...prev, cardHolder: event.target.value }))}
            autoComplete="off"
            size="small"
            fullWidth
          />

          <TextField
            label="카드 번호"
            value={form.cardNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, cardNumber: formatCardNumber(event.target.value) }))}
            autoComplete="off"
            inputProps={{ inputMode: 'numeric', maxLength: 19 }}
            placeholder="4242 4242 4242 4242"
            helperText="테스트 카드: 4242 4242 4242 4242 / 5555 5555 5555 4444"
            size="small"
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="유효기간 (MM/YY)"
              value={form.expiry}
              onChange={(event) => setForm((prev) => ({ ...prev, expiry: formatExpiry(event.target.value) }))}
              autoComplete="off"
              inputProps={{ inputMode: 'numeric', maxLength: 5 }}
              size="small"
              fullWidth
            />
            <TextField
              label="CVC"
              value={form.cvc}
              onChange={(event) => setForm((prev) => ({ ...prev, cvc: onlyDigits(event.target.value).slice(0, 4) }))}
              autoComplete="off"
              inputProps={{ inputMode: 'numeric', maxLength: 4 }}
              size="small"
              fullWidth
            />
          </Stack>

          <FormControlLabel
            control={(
              <Checkbox
                checked={form.agreed}
                onChange={(event) => setForm((prev) => ({ ...prev, agreed: event.target.checked }))}
              />
            )}
            label="테스트 결제이며 실청구/실승인이 발생하지 않음을 확인했습니다."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={submitting}
              fullWidth
            >
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={!canSubmit}
              fullWidth
              sx={{ bgcolor: '#111111', '&:hover': { bgcolor: '#000000' } }}
            >
              {submitting ? '결제 확인 중...' : '테스트 결제 승인'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default MockPaymentDialog
