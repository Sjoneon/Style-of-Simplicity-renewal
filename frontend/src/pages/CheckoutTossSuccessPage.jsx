import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../services/api'
import { purchaseCart, purchaseProduct } from '../services/orderApi'
import { confirmTossPayment } from '../services/paymentApi'
import { readPendingCheckout, removePendingCheckout } from './checkout/checkoutStorage'

function CheckoutTossSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const paymentKey = String(searchParams.get('paymentKey') || '').trim()
  const orderId = String(searchParams.get('orderId') || '').trim()
  const amount = Number(searchParams.get('amount') || 0)

  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const pending = useMemo(() => readPendingCheckout(orderId), [orderId])

  useEffect(() => {
    let active = true

    const processPayment = async () => {
      if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
        setError('결제 승인 파라미터가 올바르지 않습니다.')
        setProcessing(false)
        return
      }

      if (!pending) {
        setError('주문 정보를 찾을 수 없습니다. 주문서를 다시 진행해 주세요.')
        setProcessing(false)
        return
      }

      const expectedAmount = Number(pending.totalAmount || 0)
      if (expectedAmount !== amount) {
        setError('결제 금액 검증에 실패했습니다. 다시 시도해 주세요.')
        setProcessing(false)
        return
      }

      try {
        await confirmTossPayment({
          paymentKey,
          orderId,
          amount,
        })

        if (pending.mode === 'product') {
          await purchaseProduct(pending.productId, pending.optionId || undefined)
        } else if (pending.mode === 'cart') {
          await purchaseCart()
        } else {
          throw new Error('주문 모드를 확인할 수 없습니다.')
        }

        removePendingCheckout(orderId)

        if (!active) {
          return
        }
        setSuccessMessage('결제가 승인되어 주문이 완료되었습니다.')
      } catch (err) {
        if (!active) {
          return
        }
        setError(getApiErrorMessage(err, '결제 승인 또는 주문 처리에 실패했습니다.'))
      } finally {
        if (active) {
          setProcessing(false)
        }
      }
    }

    processPayment()
    return () => {
      active = false
    }
  }, [amount, orderId, paymentKey, pending])

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>결제 결과</Typography>

      <Paper sx={{ p: 2.2, borderRadius: 3 }}>
        {processing ? (
          <Stack spacing={1.2} alignItems="center" sx={{ py: 3 }}>
            <CircularProgress />
            <Typography color="text.secondary">결제 승인과 주문 처리를 진행 중입니다.</Typography>
          </Stack>
        ) : (
          <Stack spacing={1.2}>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Alert severity="success">{successMessage || '결제가 완료되었습니다.'}</Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => navigate('/')}>홈으로 이동</Button>
              <Button variant="contained" onClick={() => navigate('/mypage')}>
                주문 내역 확인
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}

export default CheckoutTossSuccessPage
