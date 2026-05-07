import { Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { ORDER_ACTIONS, ORDER_STATUS_LABELS } from '../../pages/seller-dashboard/sellerDashboardUtils'

function OrdersTabPanel({
  visibleOrders,
  orderStatusFilter,
  setOrderStatusFilter,
  orderStatusFilterOptions,
  orderStatusSummary,
  actionLoadingOrderId,
  onOrderAction,
  formatMoney,
  formatDateTime,
}) {
  return (
    <Stack spacing={1.5}>
      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            {orderStatusFilterOptions.filter((option) => option.value !== 'ALL').map((option) => (
              <Chip
                key={option.value}
                size="small"
                variant="outlined"
                label={`${option.label} ${Number(orderStatusSummary[option.value] || 0)}건`}
              />
            ))}
          </Stack>

          <TextField
            select
            label="상태 필터"
            size="small"
            value={orderStatusFilter}
            onChange={(event) => setOrderStatusFilter(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            {orderStatusFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2 }}>주문/배송 처리</Typography>
        {visibleOrders.length === 0 ? (
          <Typography color="text.secondary">조건에 맞는 주문이 없습니다.</Typography>
        ) : (
          <Stack spacing={1.2}>
            {visibleOrders.map((order) => (
              <Paper key={order.id} variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
                <Stack spacing={0.9}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
                    <Typography fontWeight={700}>
                      #{order.id} {order.productName}{order.sizeLabel ? ` (${order.sizeLabel})` : ''} x {order.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{formatDateTime(order.orderDate)}</Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                    <Chip size="small" variant="outlined" label={ORDER_STATUS_LABELS[order.status] || order.status} />
                    <Typography variant="body2" color="text.secondary">결제금액: {formatMoney(order.totalAmount)}</Typography>
                  </Stack>

                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {ORDER_ACTIONS.map((option) => (
                      <Button
                        key={`${order.id}-${option.action}`}
                        size="small"
                        variant="outlined"
                        disabled={actionLoadingOrderId === order.id}
                        onClick={() => onOrderAction(order.id, option.action)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}

export default OrdersTabPanel
