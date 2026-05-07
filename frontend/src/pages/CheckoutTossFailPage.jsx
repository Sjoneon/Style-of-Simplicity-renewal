import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { readPendingCheckout } from './checkout/checkoutStorage'

function CheckoutTossFailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const code = String(searchParams.get('code') || '').trim()
  const message = String(searchParams.get('message') || '').trim()
  const orderId = String(searchParams.get('orderId') || '').trim()
  const pending = readPendingCheckout(orderId)

  const handleBackToCheckout = () => {
    if (pending) {
      navigate('/checkout', {
        state: {
          mode: pending.mode,
          productId: pending.productId,
          optionId: pending.optionId,
          orderItems: pending.orderItems,
          totalAmount: pending.totalAmount,
        },
      })
      return
    }
    navigate('/cart')
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={800}>결제 실패</Typography>

      <Paper sx={{ p: 2.2, borderRadius: 3 }}>
        <Stack spacing={1.2}>
          <Alert severity="error">
            {message || '결제가 취소되었거나 실패했습니다.'}
          </Alert>
          {code && (
            <Typography variant="body2" color="text.secondary">
              오류 코드: {code}
            </Typography>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/')}>홈으로 이동</Button>
            <Button variant="contained" onClick={handleBackToCheckout}>
              주문서로 돌아가기
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}

export default CheckoutTossFailPage
