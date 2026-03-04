import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'

function normalizeKoreanMobilePhone(phone) {
  const raw = String(phone || '').trim()
  const digitsOnly = raw.replace(/\D/g, '')

  if (/^010\d{8}$/.test(digitsOnly)) {
    return digitsOnly.replace(/(010)(\d{4})(\d{4})/, '$1-$2-$3')
  }

  if (/^010\d{7}$/.test(digitsOnly)) {
    return digitsOnly.replace(/(010)(\d{3})(\d{4})/, '$1-$2-$3')
  }

  return raw
}

function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, login, register, logout } = useAuth()

  const nextPath = useMemo(() => {
    const next = searchParams.get('next')
    return next && next.startsWith('/') ? next : '/'
  }, [searchParams])

  const [tabValue, setTabValue] = useState('login')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    if (!user) {
      return
    }

    if (user.userType === 'seller') {
      navigate('/admin/dashboard', { replace: true })
      return
    }

    navigate(nextPath, { replace: true })
  }, [user, nextPath, navigate])

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    setSubmitting(true)
    setError('')
    setInfoMessage('')

    try {
      const session = await login(loginForm)
      if (session?.userType === 'seller') {
        await logout()
        setError('관리자 로그인은 전용 페이지에서 진행해 주세요.')
        navigate('/admin/login', { replace: true })
      } else {
        navigate(nextPath, { replace: true })
      }
    } catch (err) {
      setError(getApiErrorMessage(err, '로그인 처리에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    setSubmitting(true)
    setError('')
    setInfoMessage('')

    const normalizedPhone = normalizeKoreanMobilePhone(registerForm.phone)
    if (!/^010-\d{3,4}-\d{4}$/.test(normalizedPhone)) {
      setError('휴대폰 번호는 010-XXXX-XXXX 형식으로 입력해 주세요.')
      setSubmitting(false)
      return
    }

    try {
      const response = await register({
        ...registerForm,
        phone: normalizedPhone,
      })
      setInfoMessage(response.message || '회원가입이 완료되었습니다. 로그인해 주세요.')
      setTabValue('login')
      setLoginForm((prev) => ({ ...prev, username: registerForm.email }))
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, '회원가입 처리에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={2.2} sx={{ alignItems: 'center' }}>
      <Stack spacing={0.7} sx={{ width: '100%', maxWidth: 560 }}>
        <Typography variant="h4" fontWeight={800}>
          로그인 / 회원가입
        </Typography>
        <Typography variant="body1" color="text.secondary">
          사용자 이메일로 로그인할 수 있습니다.
        </Typography>
      </Stack>

      <Paper sx={{ width: '100%', maxWidth: 560, p: 2.5, borderRadius: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2.2 }}>
          <Tab value="login" label="로그인" />
          <Tab value="register" label="회원가입" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {infoMessage && <Alert severity="success" sx={{ mb: 1.5 }}>{infoMessage}</Alert>}

        {tabValue === 'login' ? (
          <Box component="form" onSubmit={handleLoginSubmit}>
            <Stack spacing={1.4}>
              <TextField
                label="이메일"
                placeholder="사용자 이메일"
                value={loginForm.username}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="비밀번호"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={submitting}>
                로그인
              </Button>
              <Button variant="text" color="inherit" onClick={() => navigate('/admin/login')}>
                슈퍼관리자 로그인
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegisterSubmit}>
            <Stack spacing={1.4}>
              <TextField
                label="이름"
                value={registerForm.name}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="이메일"
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="비밀번호"
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="휴대폰 번호"
                placeholder="010-1234-5678"
                value={registerForm.phone}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, phone: event.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="주소"
                value={registerForm.address}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, address: event.target.value }))}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={submitting}>
                회원가입
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Stack>
  )
}

export default AuthPage
