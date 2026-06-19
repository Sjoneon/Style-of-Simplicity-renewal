import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import { getInquiryCategoryLabel } from '../services/inquiryApi'
import InquiriesTabPanel from '../components/seller-dashboard/InquiriesTabPanel'
import OrdersTabPanel from '../components/seller-dashboard/OrdersTabPanel'
import OverviewTabPanel from '../components/seller-dashboard/OverviewTabPanel'
import HomeTabPanel from '../components/seller-dashboard/HomeTabPanel'
import ProductDialog from '../components/seller-dashboard/ProductDialog'
import ProductsTabPanel from '../components/seller-dashboard/ProductsTabPanel'
import SalesTabPanel from '../components/seller-dashboard/SalesTabPanel'
import SellerDashboardSideNav from '../components/seller-dashboard/SellerDashboardSideNav'
import { formatDateTime, formatMoney } from './seller-dashboard/sellerDashboardUtils'
import useSellerDashboardController from './seller-dashboard/useSellerDashboardController'

function SellerDashboardPage() {
  const { user } = useAuth()
  const {
    ui,
    data,
    metrics,
    orderView,
    inquiryView,
    homeManageView,
    productManageView,
    salesView,
    productDialogView,
    actions,
  } = useSellerDashboardController(user)

  if (ui.loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    )
  }

  const salesChartData = metrics.salesCharts?.[salesView.activeSalesPeriod] || []
  const totalSalesAmountText = formatMoney(metrics.totalSalesAmount)
  const dailySalesAmountText = formatMoney(metrics.dailySalesAmount)
  const monthlySalesAmountText = formatMoney(metrics.monthlySalesAmount)
  const yearlySalesAmountText = formatMoney(metrics.yearlySalesAmount)

  return (
    <Stack spacing={2.2}>
      <Stack spacing={0.7}>
        <Typography variant="h4" fontWeight={800}>판매자 대시보드</Typography>
        <Typography variant="body1" color="text.secondary">
          상품 등록/수정, 주문·배송 처리, 매출 확인, Q&A 답변을 한 곳에서 운영합니다.
        </Typography>
      </Stack>

      {ui.error && <Alert severity="error">{ui.error}</Alert>}
      {ui.successMessage && (
        <Alert severity="success" onClose={() => ui.setSuccessMessage('')}>
          {ui.successMessage}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '230px minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <SellerDashboardSideNav
          activeTab={ui.activeTab}
          activeHomeView={homeManageView.activeHomeView}
          inquiryAnswerFilter={inquiryView.inquiryAnswerFilter}
          onSelectTab={ui.setActiveTab}
          onSelectHomeView={homeManageView.setActiveHomeView}
          onSelectInquiryAnswerFilter={inquiryView.setInquiryAnswerFilter}
        />

        <Box sx={{ minWidth: 0 }}>
          {ui.activeTab === 'overview' && (
            <OverviewTabPanel
              myProductsCount={data.myProducts.length}
              totalSalesAmountText={totalSalesAmountText}
              dailySalesAmountText={dailySalesAmountText}
              monthlySalesAmountText={monthlySalesAmountText}
              yearlySalesAmountText={yearlySalesAmountText}
              activeSalesPeriod={salesView.activeSalesPeriod}
              setActiveSalesPeriod={salesView.setActiveSalesPeriod}
              salesChartData={salesChartData}
              todayOrderCount={metrics.todayOrderCount}
              unansweredInquiryCount={metrics.unansweredInquiryCount}
              shippingPendingCount={metrics.shippingPendingCount}
              orderStatusSummary={metrics.orderStatusSummary}
              orderStatusFilterOptions={orderView.orderStatusFilterOptions}
              formatMoney={formatMoney}
            />
          )}

          {ui.activeTab === 'home' && (
            <HomeTabPanel
              activeHomeView={homeManageView.activeHomeView}
              bannerForm={homeManageView.bannerForm}
              setBannerForm={homeManageView.setBannerForm}
              myProducts={data.myProducts}
              banners={data.banners}
              savingBanner={homeManageView.savingBanner}
              deletingBannerId={homeManageView.deletingBannerId}
              onCreateBanner={actions.handleCreateBanner}
              onResetBanner={actions.resetBannerForm}
              onDeleteBanner={actions.handleDeleteBanner}
              managedDiscoveryTabs={data.managedDiscoveryTabs}
              discoveryTabDrafts={data.discoveryTabDrafts}
              setDiscoveryTabDrafts={data.setDiscoveryTabDrafts}
              newDiscoveryTabForm={homeManageView.newDiscoveryTabForm}
              setNewDiscoveryTabForm={homeManageView.setNewDiscoveryTabForm}
              creatingDiscoveryTab={homeManageView.creatingDiscoveryTab}
              updatingDiscoveryTabId={homeManageView.updatingDiscoveryTabId}
              deletingDiscoveryTabId={homeManageView.deletingDiscoveryTabId}
              onCreateDiscoveryTab={actions.handleCreateDiscoveryTab}
              onSaveDiscoveryTab={actions.handleSaveDiscoveryTab}
              onDeleteDiscoveryTab={actions.handleDeleteDiscoveryTab}
            />
          )}

          {ui.activeTab === 'products' && (
            <ProductsTabPanel
              myProducts={data.myProducts}
              visibleProducts={data.visibleProducts}
              filteredProductsCount={data.filteredProductsCount}
              productCategoryFilterOptions={data.productCategoryFilterOptions}
              productCategoryFilter={productManageView.productCategoryFilter}
              setProductCategoryFilter={productManageView.setProductCategoryFilter}
              productSortOrder={productManageView.productSortOrder}
              setProductSortOrder={productManageView.setProductSortOrder}
              productSortOptions={productManageView.sortOptions}
              productPage={productManageView.productPage}
              setProductPage={productManageView.setProductPage}
              productPageCount={productManageView.productPageCount}
              pageSize={productManageView.pageSize}
              formatMoney={formatMoney}
              onOpenCreateDialog={actions.openCreateProductDialog}
              onOpenEditDialog={actions.openEditProductDialog}
              onDeleteProduct={actions.handleDeleteProduct}
            />
          )}

          {ui.activeTab === 'orders' && (
            <OrdersTabPanel
              visibleOrders={orderView.visibleOrders}
              orderStatusFilter={orderView.orderStatusFilter}
              setOrderStatusFilter={orderView.setOrderStatusFilter}
              orderStatusFilterOptions={orderView.orderStatusFilterOptions}
              orderStatusSummary={metrics.orderStatusSummary}
              actionLoadingOrderId={orderView.actionLoadingOrderId}
              onOrderAction={actions.handleOrderAction}
              formatMoney={formatMoney}
              formatDateTime={formatDateTime}
            />
          )}

          {ui.activeTab === 'inquiries' && (
            <InquiriesTabPanel
              visibleInquiries={inquiryView.visibleInquiries}
              inquiryAnswerFilter={inquiryView.inquiryAnswerFilter}
              answeredInquiryCount={metrics.answeredInquiryCount}
              unansweredInquiryCount={metrics.unansweredInquiryCount}
              inquiryCategoryFilter={inquiryView.inquiryCategoryFilter}
              setInquiryCategoryFilter={inquiryView.setInquiryCategoryFilter}
              inquiryCategoryFilterOptions={inquiryView.inquiryCategoryFilterOptions}
              inquiryDrafts={inquiryView.inquiryDrafts}
              setInquiryDrafts={inquiryView.setInquiryDrafts}
              savingInquiryId={inquiryView.savingInquiryId}
              deletingInquiryId={inquiryView.deletingInquiryId}
              onSaveInquiry={actions.handleSaveInquiryAnswer}
              onDeleteInquiry={actions.handleDeleteInquiry}
              getInquiryCategoryLabel={getInquiryCategoryLabel}
              formatDateTime={formatDateTime}
            />
          )}

          {ui.activeTab === 'sales' && (
            <SalesTabPanel
              activeSalesPeriod={salesView.activeSalesPeriod}
              setActiveSalesPeriod={salesView.setActiveSalesPeriod}
              salesChartData={salesChartData}
              totalSalesAmountText={totalSalesAmountText}
              dailySalesAmountText={dailySalesAmountText}
              monthlySalesAmountText={monthlySalesAmountText}
              yearlySalesAmountText={yearlySalesAmountText}
              formatMoney={formatMoney}
            />
          )}
        </Box>
      </Box>

      <ProductDialog
        mode="create"
        open={productDialogView.createDialogOpen}
        onClose={actions.closeCreateProductDialog}
        onSubmit={actions.handleCreateProduct}
        saving={productDialogView.savingProduct}
        errorMessage={ui.error}
        form={productDialogView.productForm}
        setForm={productDialogView.setProductForm}
        assignableDiscoveryTabs={data.assignableDiscoveryTabs}
        onToggleDiscoveryTab={actions.handleToggleCreateProductDiscoveryTab}
      />

      <ProductDialog
        mode="edit"
        open={productDialogView.editDialogOpen}
        onClose={actions.closeEditProductDialog}
        onSubmit={actions.handleUpdateProduct}
        saving={productDialogView.updatingProduct}
        errorMessage={ui.error}
        form={productDialogView.editProductForm}
        setForm={productDialogView.setEditProductForm}
        assignableDiscoveryTabs={data.assignableDiscoveryTabs}
        onToggleDiscoveryTab={actions.handleToggleEditProductDiscoveryTab}
      />
    </Stack>
  )
}

export default SellerDashboardPage
