import { Alert, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import MyPageAccountSection from '../components/mypage/MyPageAccountSection'
import MyPageBenefitsSection from '../components/mypage/MyPageBenefitsSection'
import MyPageHeaderCard from '../components/mypage/MyPageHeaderCard'
import MyPageInterestSection from '../components/mypage/MyPageInterestSection'
import MyPageOrdersSection from '../components/mypage/MyPageOrdersSection'
import MyPageReviewsSection from '../components/mypage/MyPageReviewsSection'
import MyPageShippingSection from '../components/mypage/MyPageShippingSection'
import { SECTION_SX } from './mypage/myPageConfig'
import useMyPageController from './mypage/useMyPageController'

function MyPagePage() {
  const {
    auth,
    layout,
    orderView,
    interestView,
    reviewView,
    accountView,
    actions,
  } = useMyPageController()

  return (
    <Stack spacing={1.2}>
      <MyPageHeaderCard
        user={auth.user}
        orderTotal={orderView.orderSummary.total}
        reviewTotal={reviewView.reviewSummary.total}
        inquiryTotal={orderView.inquirySummary.total}
        wishlistTotal={interestView.wishlistItems.length}
      />

      {auth.authLoading ? (
        <Paper sx={SECTION_SX}>
          <Stack alignItems="center" spacing={1} sx={{ py: 2 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">세션을 확인하고 있습니다.</Typography>
          </Stack>
        </Paper>
      ) : (
        <>
          {orderView.error && <Alert severity="error" sx={{ borderRadius: 2 }}>{orderView.error}</Alert>}

          <MyPageOrdersSection
            expandedSection={layout.expandedSection}
            onToggleSection={layout.toggleSection}
            isUserAccount={auth.isUserAccount}
            isSellerAccount={auth.isSellerAccount}
            statusFilter={orderView.statusFilter}
            setStatusFilter={orderView.setStatusFilter}
            onRefresh={actions.loadMyPageData}
            loading={orderView.loading}
            visibleOrders={orderView.visibleOrders}
            orderSummary={orderView.orderSummary}
            onGoHome={() => actions.navigate('/')}
            onGoSellerDashboard={() => actions.navigate('/admin/dashboard')}
          />

          <MyPageBenefitsSection
            expandedSection={layout.expandedSection}
            onToggleSection={layout.toggleSection}
          />

          <MyPageInterestSection
            expandedSection={layout.expandedSection}
            onToggleSection={layout.toggleSection}
            isUserAccount={auth.isUserAccount}
            loading={orderView.loading}
            wishlistItems={interestView.wishlistItems}
            recentViewedItems={interestView.recentViewedItems}
            removingWishlistProductId={interestView.removingWishlistProductId}
            onRemoveWishlist={actions.handleRemoveWishlist}
            onGoHome={() => actions.navigate('/')}
            onGoProduct={(productId) => actions.navigate(`/products/${productId}`)}
          />

          <MyPageReviewsSection
            expandedSection={layout.expandedSection}
            onToggleSection={layout.toggleSection}
            isUserAccount={auth.isUserAccount}
            reviewSummary={reviewView.reviewSummary}
            inquirySummary={orderView.inquirySummary}
            reviewError={reviewView.reviewError}
            reviewSuccess={reviewView.reviewSuccess}
            setReviewSuccess={reviewView.setReviewSuccess}
            reviewForm={reviewView.reviewForm}
            setReviewForm={reviewView.setReviewForm}
            onReviewSubmit={actions.handleReviewSubmit}
            savingReview={reviewView.savingReview}
            reviewableOrders={reviewView.reviewableOrders}
            recentReviews={reviewView.recentReviews}
            recentInquiries={orderView.recentInquiries}
            onGoProduct={(productId) => actions.navigate(`/products/${productId}`)}
            onGoSupport={() => actions.navigate('/support')}
          />

          <MyPageShippingSection
            expandedSection={layout.expandedSection}
            onToggleSection={layout.toggleSection}
            isUserAccount={auth.isUserAccount}
            resolvedAddressValue={accountView.resolvedAddressValue}
            accountError={accountView.accountError}
            accountSuccess={accountView.accountSuccess}
            setAccountSuccess={accountView.setAccountSuccess}
            addressForm={accountView.addressForm}
            setAddressForm={accountView.setAddressForm}
            openingAddressSearch={accountView.openingAddressSearch}
            savingAddress={accountView.savingAddress}
            onOpenAddressSearch={actions.handleOpenAddressSearch}
            onSubmitAddress={actions.handleAddressSubmit}
          />

          <MyPageAccountSection
            expandedSection={layout.expandedSection}
            onToggleSection={layout.toggleSection}
            user={auth.user}
            isUserAccount={auth.isUserAccount}
            isSellerAccount={auth.isSellerAccount}
            loggingOut={actions.loggingOut}
            onLogout={actions.handleLogout}
            onGoSupport={() => actions.navigate('/support')}
            onGoHome={() => actions.navigate('/')}
            accountError={accountView.accountError}
            accountSuccess={accountView.accountSuccess}
            setAccountSuccess={accountView.setAccountSuccess}
            profileForm={accountView.profileForm}
            setProfileForm={accountView.setProfileForm}
            onSubmitProfile={actions.handleProfileSubmit}
            savingProfile={accountView.savingProfile}
            passwordForm={accountView.passwordForm}
            setPasswordForm={accountView.setPasswordForm}
            onSubmitPassword={actions.handlePasswordSubmit}
            savingPassword={accountView.savingPassword}
          />
        </>
      )}
    </Stack>
  )
}

export default MyPagePage
