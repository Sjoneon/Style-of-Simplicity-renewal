import { Paper, Stack, Typography } from '@mui/material'
import { ITEM_SX } from '../../pages/mypage/myPageConfig'
import MyPageSectionCard from './MyPageSectionCard'

function MyPageBenefitsSection({ expandedSection, onToggleSection }) {
  return (
    <MyPageSectionCard
      sectionKey="benefits"
      title="2. 혜택 관리"
      summaryText="쿠폰 0장 · 적립금 0P"
      expandedSection={expandedSection}
      onToggle={onToggleSection}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
        <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">보유 쿠폰</Typography>
          <Typography fontWeight={700}>0장</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">적립금</Typography>
          <Typography fontWeight={700}>0P</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">사용 가능 혜택</Typography>
          <Typography fontWeight={700}>준비중</Typography>
        </Paper>
      </Stack>
    </MyPageSectionCard>
  )
}

export default MyPageBenefitsSection
