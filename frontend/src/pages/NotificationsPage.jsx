import { Paper, Stack, Typography } from '@mui/material'

function NotificationsPage() {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={800}>
          알림
        </Typography>
        <Typography color="text.secondary">
          재입고, 할인, 주문 상태 변경 알림을 이곳에서 확인하도록 확장할 예정입니다.
        </Typography>
      </Stack>
    </Paper>
  )
}

export default NotificationsPage
