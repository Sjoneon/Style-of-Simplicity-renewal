import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { SECTION_SX } from '../../pages/mypage/myPageConfig'

function MyPageHeaderCard({ user, orderTotal, reviewTotal, inquiryTotal, wishlistTotal }) {
  return (
    <Paper sx={SECTION_SX}>
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={800}>마이</Typography>
          <Typography variant="caption" color="text.secondary">MY PAGE</Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #dcdcdc', bgcolor: '#f3f3f3' }} />
          <Typography fontWeight={700}>{user?.name || '사용자'} 님</Typography>
          <Typography variant="body2" color="text.secondary">환영합니다</Typography>
        </Stack>

        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
          <Chip size="small" variant="outlined" label={`주문 ${orderTotal}건`} />
          <Chip size="small" variant="outlined" label={`리뷰 ${reviewTotal}건`} />
          <Chip size="small" variant="outlined" label={`문의 ${inquiryTotal}건`} />
          <Chip size="small" variant="outlined" label={`찜 ${wishlistTotal}건`} />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          아래 항목을 눌러 세부 정보를 확인하세요.
        </Typography>
      </Stack>
    </Paper>
  )
}

export default MyPageHeaderCard
