import { Paper, Stack, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

function MyPagePage() {
  const { user } = useAuth()

  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={800}>
          마이페이지
        </Typography>
        <Typography color="text.secondary">
          {user?.name || '사용자'} 님의 주문/관심/기본정보 관리를 이곳에서 제공할 예정입니다.
        </Typography>
      </Stack>
    </Paper>
  )
}

export default MyPagePage
