import { Stack } from '@mui/material'
import DiscoveryTabManager from './DiscoveryTabManager'
import HomeBannerManager from './HomeBannerManager'

function HomeTabPanel(props) {
  const {
    bannerForm,
    setBannerForm,
    myProducts,
    banners,
    savingBanner,
    deletingBannerId,
    onCreateBanner,
    onResetBanner,
    onDeleteBanner,
    managedDiscoveryTabs,
    discoveryTabDrafts,
    setDiscoveryTabDrafts,
    newDiscoveryTabForm,
    setNewDiscoveryTabForm,
    creatingDiscoveryTab,
    updatingDiscoveryTabId,
    deletingDiscoveryTabId,
    onCreateDiscoveryTab,
    onSaveDiscoveryTab,
    onDeleteDiscoveryTab,
  } = props

  return (
    <Stack spacing={1.6}>
      <HomeBannerManager
        bannerForm={bannerForm}
        setBannerForm={setBannerForm}
        myProducts={myProducts}
        banners={banners}
        savingBanner={savingBanner}
        deletingBannerId={deletingBannerId}
        onSubmit={onCreateBanner}
        onReset={onResetBanner}
        onDelete={onDeleteBanner}
      />

      <DiscoveryTabManager
        managedDiscoveryTabs={managedDiscoveryTabs}
        discoveryTabDrafts={discoveryTabDrafts}
        setDiscoveryTabDrafts={setDiscoveryTabDrafts}
        newDiscoveryTabForm={newDiscoveryTabForm}
        setNewDiscoveryTabForm={setNewDiscoveryTabForm}
        creatingDiscoveryTab={creatingDiscoveryTab}
        updatingDiscoveryTabId={updatingDiscoveryTabId}
        deletingDiscoveryTabId={deletingDiscoveryTabId}
        onCreate={onCreateDiscoveryTab}
        onSave={onSaveDiscoveryTab}
        onDelete={onDeleteDiscoveryTab}
      />
    </Stack>
  )
}

export default HomeTabPanel
