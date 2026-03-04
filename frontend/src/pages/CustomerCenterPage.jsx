import { Paper, Stack, Typography } from '@mui/material'

function CustomerCenterPage() {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={800}>
          고객센터
        </Typography>
        <Typography color="text.secondary">
          자주 묻는 질문, 배송/환불 안내, 문의 접수 기능을 순차적으로 추가할 예정입니다.
        </Typography>
      </Stack>
    </Paper>
  )
}

export default CustomerCenterPage
