import { Stack } from '@mui/material'
import SalesChartPanel from './SalesChartPanel'

function SalesTabPanel({
  activeSalesPeriod,
  setActiveSalesPeriod,
  salesChartData,
  totalSalesAmountText,
  dailySalesAmountText,
  monthlySalesAmountText,
  yearlySalesAmountText,
  formatMoney,
}) {
  return (
    <Stack spacing={1.5}>
      <SalesChartPanel
        title="매출 관리"
        activeSalesPeriod={activeSalesPeriod}
        onSalesPeriodChange={setActiveSalesPeriod}
        salesChartData={salesChartData}
        totalSalesAmountText={totalSalesAmountText}
        dailySalesAmountText={dailySalesAmountText}
        monthlySalesAmountText={monthlySalesAmountText}
        yearlySalesAmountText={yearlySalesAmountText}
        formatMoney={formatMoney}
      />
    </Stack>
  )
}

export default SalesTabPanel
