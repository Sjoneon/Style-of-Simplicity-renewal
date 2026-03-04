import { Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

function NotFoundPage() {
  return (
    <Stack spacing={1.2} alignItems="center" sx={{ py: 8 }}>
      <Typography variant="h4" fontWeight={800}>
        페이지를 찾을 수 없습니다.
      </Typography>
      <Typography color="text.secondary">주소를 다시 확인해 주세요.</Typography>
      <Button component={RouterLink} to="/" variant="contained">
        메인으로 이동
      </Button>
    </Stack>
  )
}

export default NotFoundPage
