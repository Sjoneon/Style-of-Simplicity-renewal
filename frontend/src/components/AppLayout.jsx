import { useCallback, useEffect, useState } from 'react'
import {
  AppBar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMyNotificationSummary } from '../services/notificationApi'

function AppLayout() {
  const navigate = useNavigate()
  const { user, authLoading, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  // 헤더 미읽음 알림 수 배지 상태
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  const loadNotificationSummary = useCallback(async () => {
    if (user?.userType !== 'user' || !user?.id) {
      setUnreadNotificationCount(0)
      return
    }

    try {
      const response = await fetchMyNotificationSummary()
      const unread = Number(response?.data?.unread || 0)
      setUnreadNotificationCount(unread > 0 ? unread : 0)
    } catch (error) {
      if (error?.response?.status === 401) {
        setUnreadNotificationCount(0)
        return
      }
      console.error('Failed to load notification summary', error)
    }
  }, [user?.id, user?.userType])

  useEffect(() => {
    loadNotificationSummary()

    // 알림 페이지 읽음 처리 후 헤더 배지 동기화 이벤트
    const onSummaryRefresh = () => {
      loadNotificationSummary()
    }
    window.addEventListener('sosos:notification-summary-refresh', onSummaryRefresh)

    if (user?.userType !== 'user' || !user?.id) {
      return () => {
        window.removeEventListener('sosos:notification-summary-refresh', onSummaryRefresh)
      }
    }

    const intervalId = window.setInterval(() => {
      // 주기 조회 30초, 페이지 이동 없이 배지 갱신
      loadNotificationSummary()
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('sosos:notification-summary-refresh', onSummaryRefresh)
    }
  }, [loadNotificationSummary, user?.id, user?.userType])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      setUnreadNotificationCount(0)
      navigate('/')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleOpenSearch = () => {
    navigate('/?openSearch=1')
  }

  const handleMoveCart = () => {
    navigate('/cart')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Toolbar sx={{ gap: 1.5, px: { xs: 2, md: 4 } }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 900, letterSpacing: '-0.02em' }}
          >
            SOS RENEWAL PROJECT
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button component={RouterLink} to="/support" color="inherit">
              고객센터
            </Button>
            <Button component={RouterLink} to="/mypage" color="inherit">
              마이페이지
            </Button>
            <Button component={RouterLink} to="/notifications" color="inherit">
              <Badge color="error" badgeContent={unreadNotificationCount} max={99}>
                <Box component="span" sx={{ pr: unreadNotificationCount > 0 ? 0.8 : 0 }}>
                  알림
                </Box>
              </Badge>
            </Button>
            {user?.userType === 'seller' && (
              <Button component={RouterLink} to="/admin/dashboard" color="inherit">
                슈퍼관리자 대시보드
              </Button>
            )}

            {authLoading ? (
              <CircularProgress size={20} />
            ) : user ? (
              <Button onClick={handleLogout} disabled={loggingOut} color="inherit">
                로그아웃
              </Button>
            ) : (
              <Button component={RouterLink} to="/auth" variant="contained" color="primary">
                로그인
              </Button>
            )}
          </Stack>
        </Toolbar>

        <Toolbar
          sx={{
            minHeight: '44px !important',
            px: { xs: 2, md: 4 },
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'flex-end',
            gap: 0.6,
          }}
        >
          <Button color="inherit" onClick={handleOpenSearch} startIcon={<SearchRoundedIcon />} sx={{ fontWeight: 700 }}>
            검색
          </Button>
          <Button color="inherit" onClick={handleMoveCart} startIcon={<ShoppingBagOutlinedIcon />} sx={{ fontWeight: 700 }}>
            장바구니
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  )
}

export default AppLayout
