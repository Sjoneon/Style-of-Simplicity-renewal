import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import { getApiErrorMessage } from '../services/api'
import { fetchMyOrders, purchaseCart } from '../services/orderApi'
import { fetchCartItems, removeProductFromCart, updateCartItemQuantity } from '../services/productApi'

function CartPage() {
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [removingCartItemId, setRemovingCartItemId] = useState(null)
  const [changingCartItemId, setChangingCartItemId] = useState(null)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [cartResponse, orderResponse] = await Promise.all([fetchCartItems(), fetchMyOrders()])
      setCartItems(Array.isArray(cartResponse.data) ? cartResponse.data : [])
      setOrders(Array.isArray(orderResponse.data) ? orderResponse.data : [])
    } catch (err) {
      setError(getApiErrorMessage(err, '장바구니 데이터를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  }, [cartItems])

  const handleRemove = async (cartItemId) => {
    setRemovingCartItemId(cartItemId)
    setError('')

    try {
      const response = await removeProductFromCart(cartItemId)
      setToastMessage(response.message || '장바구니에서 삭제했습니다.')
      await loadData()
    } catch (err) {
      setError(getApiErrorMessage(err, '상품 삭제에 실패했습니다.'))
    } finally {
      setRemovingCartItemId(null)
    }
  }

  const handlePurchaseCart = async () => {
    setIsPurchasing(true)
    setError('')

    try {
      const response = await purchaseCart()
      setToastMessage(response.message || '장바구니 주문이 완료되었습니다.')
      await loadData()
    } catch (err) {
      setError(getApiErrorMessage(err, '장바구니 주문 처리에 실패했습니다.'))
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleQuantityChange = async (cartItemId, nextQuantity) => {
    if (!cartItemId || nextQuantity <= 0) {
      return
    }

    setChangingCartItemId(cartItemId)
    setError('')

    try {
      await updateCartItemQuantity(cartItemId, nextQuantity)
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: nextQuantity }
            : item,
        ),
      )
    } catch (err) {
      setError(getApiErrorMessage(err, '장바구니 수량 변경에 실패했습니다.'))
    } finally {
      setChangingCartItemId(null)
    }
  }

  return (
    <Stack spacing={2.2}>
      <Stack spacing={0.8}>
        <Typography variant="h4" fontWeight={800}>
          장바구니
        </Typography>
        <Typography variant="body1" color="text.secondary">
          담아둔 상품을 확인하고 한 번에 주문할 수 있습니다.
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ p: 2.2, borderRadius: 3 }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : cartItems.length === 0 ? (
          <Typography color="text.secondary">장바구니가 비어 있습니다.</Typography>
        ) : (
          <Stack spacing={1.2}>
            <List disablePadding>
              {cartItems.map((item, index) => (
                <Stack key={item.cartItemId || `${item.id}-${item.selectedOptionId || 'none'}-${index}`}>
                  <ListItem disableGutters sx={{ alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={`${item.name}${item.selectedSizeLabel ? ` (${item.selectedSizeLabel})` : ''}`}
                      secondary={
                        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 0.4 }}>
                          <Typography component="span" variant="body2" color="text.secondary">
                            단가 {Number(item.price).toLocaleString('ko-KR')}원
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.2}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 999, px: 0.2 }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.cartItemId, Number(item.quantity || 0) - 1)}
                              disabled={
                                Number(item.quantity || 0) <= 1
                                || !item.cartItemId
                                || changingCartItemId === item.cartItemId
                                || removingCartItemId === item.cartItemId
                              }
                              aria-label="수량 감소"
                            >
                              <RemoveOutlinedIcon fontSize="inherit" />
                            </IconButton>
                            <Typography component="span" variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>
                              {Number(item.quantity || 0)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.cartItemId, Number(item.quantity || 0) + 1)}
                              disabled={
                                !item.cartItemId
                                || changingCartItemId === item.cartItemId
                                || removingCartItemId === item.cartItemId
                              }
                              aria-label="수량 증가"
                            >
                              <AddOutlinedIcon fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                      sx={{ pr: 2 }}
                    />
                    <Stack alignItems="flex-end" spacing={0.4} sx={{ flexShrink: 0 }}>
                      <Typography fontWeight={700}>
                        {(Number(item.price) * Number(item.quantity)).toLocaleString('ko-KR')}원
                      </Typography>
                      <Button
                        color="error"
                        onClick={() => handleRemove(item.cartItemId)}
                        disabled={isPurchasing || changingCartItemId === item.cartItemId || removingCartItemId === item.cartItemId}
                      >
                        삭제
                      </Button>
                    </Stack>
                  </ListItem>
                  {index < cartItems.length - 1 && <Divider />}
                </Stack>
              ))}
            </List>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight={800}>
                총 결제 금액: {totalAmount.toLocaleString('ko-KR')}원
              </Typography>
              <Button variant="contained" onClick={handlePurchaseCart} disabled={isPurchasing || cartItems.length === 0}>
                장바구니 주문하기
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2.2, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          내 주문 내역
        </Typography>
        {orders.length === 0 ? (
          <Typography color="text.secondary">주문 내역이 없습니다.</Typography>
        ) : (
          <List disablePadding>
            {orders.map((order, index) => (
              <Stack key={order.id}>
                <ListItem disableGutters>
                  <ListItemText
                    primary={`${order.productName}${order.sizeLabel ? ` (${order.sizeLabel})` : ''} x ${order.quantity}`}
                    secondary={`주문상태: ${order.status} / 주문일: ${order.orderDate?.replace('T', ' ').slice(0, 16) || '-'}`}
                  />
                  <Typography fontWeight={700}>
                    {Number(order.totalAmount).toLocaleString('ko-KR')}원
                  </Typography>
                </ListItem>
                {index < orders.length - 1 && <Divider />}
              </Stack>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2200}
        onClose={() => setToastMessage('')}
        message={toastMessage}
      />
    </Stack>
  )
}

export default CartPage
