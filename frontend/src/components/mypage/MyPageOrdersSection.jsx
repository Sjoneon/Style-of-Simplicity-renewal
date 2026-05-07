import { Button, Chip, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { ORDER_FILTER_OPTIONS, ITEM_SX } from '../../pages/mypage/myPageConfig'
import { formatDateTime, formatPrice, getOrderStatusLabel } from '../../pages/mypage/myPageUtils'
import MyPageSectionCard from './MyPageSectionCard'

function MyPageOrdersSection({
  expandedSection,
  onToggleSection,
  isUserAccount,
  isSellerAccount,
  statusFilter,
  setStatusFilter,
  onRefresh,
  loading,
  visibleOrders,
  orderSummary,
  onGoHome,
  onGoSellerDashboard,
}) {
  return (
    <MyPageSectionCard
      sectionKey="orders"
      title="1. 주문 관리"
      summaryText={`전체 ${orderSummary.total}건`}
      expandedSection={expandedSection}
      onToggle={onToggleSection}
    >
      {isUserAccount ? (
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
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" onClick={onRefresh} disabled={loading}>새로고침</Button>
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
              <Button variant="text" onClick={onGoHome} sx={{ alignSelf: 'flex-start', px: 0 }}>
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
            <Button variant="outlined" onClick={onGoSellerDashboard} sx={{ alignSelf: 'flex-start' }}>
              판매자 대시보드로 이동
            </Button>
          )}
        </Stack>
      )}
    </MyPageSectionCard>
  )
}

export default MyPageOrdersSection
