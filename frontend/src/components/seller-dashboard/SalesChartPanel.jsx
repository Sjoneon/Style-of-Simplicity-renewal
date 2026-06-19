import {
  Box,
  Chip,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

const SALES_PERIOD_LABELS = {
  day: '일 매출',
  month: '월 매출',
  year: '연 매출',
}

function SalesMetricCard({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, minWidth: { xs: '100%', sm: 160 } }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={800}>{value}</Typography>
    </Paper>
  )
}

function SalesChartPanel({
  title = '매출 추이',
  activeSalesPeriod,
  onSalesPeriodChange,
  salesChartData,
  totalSalesAmountText,
  dailySalesAmountText,
  monthlySalesAmountText,
  yearlySalesAmountText,
  formatMoney,
}) {
  const chartData = Array.isArray(salesChartData) ? salesChartData : []
  const maxAmount = Math.max(1, ...chartData.map((item) => Number(item.amount || 0)))

  return (
    <Paper sx={{ p: 2, borderRadius: 2.4 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack spacing={0.4}>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
              <Chip size="small" variant="outlined" label="취소/반품 제외" />
              <Chip size="small" variant="outlined" label="교환 포함" />
            </Stack>
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeSalesPeriod}
            onChange={(_, value) => {
              if (value) {
                onSalesPeriodChange(value)
              }
            }}
            sx={{
              alignSelf: { xs: 'stretch', md: 'center' },
              '& .MuiToggleButton-root': {
                flex: { xs: 1, md: 'initial' },
                px: 1.4,
                fontWeight: 700,
              },
            }}
          >
            <ToggleButton value="day">일 매출</ToggleButton>
            <ToggleButton value="month">월 매출</ToggleButton>
            <ToggleButton value="year">연 매출</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
          <SalesMetricCard label="누적 매출" value={totalSalesAmountText} />
          <SalesMetricCard label="일 매출" value={dailySalesAmountText} />
          <SalesMetricCard label="월 매출" value={monthlySalesAmountText} />
          <SalesMetricCard label="연 매출" value={yearlySalesAmountText} />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(chartData.length, 1)}, minmax(48px, 1fr))`,
            gap: 1,
            minHeight: 220,
            alignItems: 'end',
            pt: 1,
            overflowX: 'auto',
          }}
        >
          {chartData.map((item) => {
            const amount = Number(item.amount || 0)
            const heightPercent = Math.max(4, Math.round((amount / maxAmount) * 100))

            return (
              <Stack key={item.key} spacing={0.7} alignItems="center" sx={{ minWidth: 48 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minHeight: 18 }}>
                  {amount > 0 ? formatMoney(amount) : '0원'}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: 138,
                    display: 'flex',
                    alignItems: 'flex-end',
                    borderRadius: 1.5,
                    bgcolor: '#f0f0f0',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: `${heightPercent}%`,
                      minHeight: 8,
                      bgcolor: '#111111',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              </Stack>
            )
          })}
        </Box>

        <Typography variant="body2" color="text.secondary">
          현재 그래프 기준: {SALES_PERIOD_LABELS[activeSalesPeriod] || '일 매출'}
        </Typography>
      </Stack>
    </Paper>
  )
}

export default SalesChartPanel
