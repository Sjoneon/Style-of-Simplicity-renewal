import { Alert, CircularProgress, Snackbar, Stack } from '@mui/material'
import LoginPromptDialog from '../components/LoginPromptDialog'
import HomeFilterTabs from '../components/home/HomeFilterTabs'
import HomeHeroBanner from '../components/home/HomeHeroBanner'
import HomeSearchDialog from '../components/home/HomeSearchDialog'
import HomeSearchSummaryBar from '../components/home/HomeSearchSummaryBar'
import ProductList from '../components/ProductList'
import useHomePageController from './home/useHomePageController'

function HomePage() {
  const {
    hero,
    filters,
    listing,
    searchDialog,
    wishlist,
    authGuard,
    feedback,
  } = useHomePageController()

  return (
    <Stack spacing={1.8}>
      <HomeHeroBanner
        bannerLoading={hero.bannerLoading}
        currentBanner={hero.currentBanner}
        banners={hero.banners}
        onPrev={hero.goBannerPrev}
        onNext={hero.goBannerNext}
        onClick={hero.handleBannerClick}
      />

      <HomeFilterTabs
        discoveryTab={filters.discoveryTab}
        onChangeDiscoveryTab={filters.setDiscoveryTab}
        visibleDiscoveryTabs={filters.visibleDiscoveryTabs}
        selectedCategory={filters.selectedCategory}
        onChangeCategory={filters.setSelectedCategory}
      />

      {listing.error && <Alert severity="error">{listing.error}</Alert>}

      {listing.hasSearched && (
        <HomeSearchSummaryBar
          query={listing.query}
          onlyInStock={listing.onlyInStock}
          sortOption={filters.sortOption}
          onChangeSortOption={filters.setSortOption}
          visibleCount={listing.visibleProducts.length}
        />
      )}

      {listing.loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ProductList
          products={listing.visibleProducts}
          onToggleWishlist={wishlist.handleToggleWishlist}
          isWishlistSelected={wishlist.isWishlistSelected}
          wishlistLoadingProductId={wishlist.wishlistLoadingProductId}
        />
      )}

      <HomeSearchDialog
        open={searchDialog.searchDialogOpen}
        onClose={() => searchDialog.setSearchDialogOpen(false)}
        draftQuery={searchDialog.draftQuery}
        setDraftQuery={searchDialog.setDraftQuery}
        draftOnlyInStock={searchDialog.draftOnlyInStock}
        setDraftOnlyInStock={searchDialog.setDraftOnlyInStock}
        searchHistory={searchDialog.searchHistory}
        popularTerms={searchDialog.popularTerms}
        onApplySearch={searchDialog.applySearch}
      />

      <LoginPromptDialog
        open={authGuard.loginPromptOpen}
        onClose={() => authGuard.setLoginPromptOpen(false)}
        onLogin={authGuard.moveToLogin}
      />

      <Snackbar
        open={Boolean(feedback.toastMessage)}
        autoHideDuration={2200}
        onClose={() => feedback.setToastMessage('')}
        message={feedback.toastMessage}
      />
    </Stack>
  )
}

export default HomePage
