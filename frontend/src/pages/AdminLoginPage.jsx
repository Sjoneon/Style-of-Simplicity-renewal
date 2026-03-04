import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, login, logout } = useAuth()

  const nextPath = useMemo(() => {
    const next = searchParams.get('next')
    return next && next.startsWith('/admin') ? next : '/admin/dashboard'
  }, [searchParams])

  const [form, setForm] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  useEffect(() => {
    if (user?.userType === 'seller') {
      navigate(nextPath, { replace: true })
    }
  }, [user, nextPath, navigate])

  const handleLogoutAndRetry = async () => {
    setLogoutLoading(true)
    setError('')
    try {
      await logout()
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const session = await login(form)
      if (session?.userType !== 'seller') {
        await logout()
        setError('슈퍼관리자 계정만 관리자 페이지에 접근할 수 있습니다.')
        return
      }
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, '관리자 로그인 처리에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (user && user.userType !== 'seller') {
    return (
      <Stack spacing={2.2} sx={{ alignItems: 'center' }}>
        <Paper sx={{ width: '100%', maxWidth: 560, p: 2.5, borderRadius: 3 }}>
          <Stack spacing={1.4}>
            <Typography variant="h5" fontWeight={800}>
              관리자 로그인
            </Typography>
            <Alert severity="warning">
              현재 일반 사용자 계정으로 로그인되어 있습니다. 슈퍼관리자 로그인은 로그아웃 후 가능합니다.
            </Alert>
            <Button variant="contained" onClick={handleLogoutAndRetry} disabled={logoutLoading}>
              로그아웃 후 관리자 로그인
            </Button>
          </Stack>
        </Paper>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.2} sx={{ alignItems: 'center' }}>
      <Stack spacing={0.7} sx={{ width: '100%', maxWidth: 560 }}>
        <Typography variant="h4" fontWeight={800}>
          슈퍼관리자 로그인
        </Typography>
        <Typography variant="body1" color="text.secondary">
          관리자 전용 계정(사업자번호)으로 로그인하세요.
        </Typography>
      </Stack>

      <Paper sx={{ width: '100%', maxWidth: 560, p: 2.5, borderRadius: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={1.4}>
            <TextField
              label="사업자번호"
              placeholder="000-00-00000"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="비밀번호"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={submitting}>
              관리자 로그인
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  )
}

export default AdminLoginPage
