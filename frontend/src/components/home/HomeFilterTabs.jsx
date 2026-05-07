import { Paper, Tab, Tabs } from '@mui/material'
import { ALL_CATEGORIES, BASE_CATEGORIES } from '../../pages/home/homeConfig'

function HomeFilterTabs({
  discoveryTab,
  onChangeDiscoveryTab,
  visibleDiscoveryTabs,
  selectedCategory,
  onChangeCategory,
}) {
  return (
    <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Tabs
        value={discoveryTab}
        onChange={(_, value) => onChangeDiscoveryTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ px: 1.2, '& .MuiTabs-indicator': { backgroundColor: '#111111' } }}
      >
        {visibleDiscoveryTabs.map((tab) => (
          <Tab
            key={tab.tabKey}
            value={tab.tabKey}
            label={tab.label}
            sx={{ fontWeight: 700, color: '#555555', '&.Mui-selected': { color: '#111111' } }}
          />
        ))}
      </Tabs>

      <Tabs
        value={selectedCategory}
        onChange={(_, value) => onChangeCategory(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ px: 1.2, borderTop: '1px solid', borderColor: 'divider', '& .MuiTabs-indicator': { backgroundColor: '#111111' } }}
      >
        <Tab value={ALL_CATEGORIES} label="ALL" sx={{ fontWeight: 700, '&.Mui-selected': { color: '#111111' } }} />
        {BASE_CATEGORIES.map((category) => (
          <Tab
            key={category}
            value={category}
            label={category}
            sx={{ fontWeight: 700, '&.Mui-selected': { color: '#111111' } }}
          />
        ))}
      </Tabs>
    </Paper>
  )
}

export default HomeFilterTabs
