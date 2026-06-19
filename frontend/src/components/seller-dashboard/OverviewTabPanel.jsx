import { Chip, Paper, Stack, Typography } from '@mui/material'

import SalesChartPanel from './SalesChartPanel'

function OverviewTabPanel({
  myProductsCount,
  totalSalesAmountText,
  dailySalesAmountText,
  monthlySalesAmountText,
  yearlySalesAmountText,
  activeSalesPeriod,
  setActiveSalesPeriod,
  salesChartData,
  todayOrderCount,
  unansweredInquiryCount,
  shippingPendingCount,
  orderStatusSummary,
  orderStatusFilterOptions,
  formatMoney,
}) {
  return (
    <Stack spacing={1.4}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">등록 상품 수</Typography>
          <Typography variant="h4" fontWeight={800}>{myProductsCount}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">누적 매출</Typography>
          <Typography variant="h4" fontWeight={800}>{totalSalesAmountText}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">오늘 주문</Typography>
          <Typography variant="h4" fontWeight={800}>{todayOrderCount}건</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">미답변 Q&A</Typography>
          <Typography variant="h4" fontWeight={800}>{unansweredInquiryCount}건</Typography>
        </Paper>
      </Stack>

      <SalesChartPanel
        title="기간별 매출"
        activeSalesPeriod={activeSalesPeriod}
        onSalesPeriodChange={setActiveSalesPeriod}
        salesChartData={salesChartData}
        totalSalesAmountText={totalSalesAmountText}
        dailySalesAmountText={dailySalesAmountText}
        monthlySalesAmountText={monthlySalesAmountText}
        yearlySalesAmountText={yearlySalesAmountText}
        formatMoney={formatMoney}
      />

      <Paper sx={{ p: 2.0, borderRadius: 2.4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="body2" color="text.secondary">배송 확인 필요</Typography>
          <Chip label={`${shippingPendingCount}건`} color={shippingPendingCount > 0 ? 'warning' : 'default'} size="small" />
        </Stack>
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {orderStatusFilterOptions.filter((item) => item.value !== 'ALL').map((item) => (
            <Chip
              key={item.value}
              size="small"
              variant="outlined"
              label={`${item.label} ${Number(orderStatusSummary[item.value] || 0)}건`}
            />
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}

export default OverviewTabPanel
