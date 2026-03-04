import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

function LoginPromptDialog({ open, onClose, onLogin }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>로그인이 필요합니다</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          장바구니 담기와 주문 기능은 로그인 후 사용할 수 있습니다.
          지금 로그인 페이지로 이동할까요?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          계속 둘러보기
        </Button>
        <Button onClick={onLogin} variant="contained">
          로그인하기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LoginPromptDialog
