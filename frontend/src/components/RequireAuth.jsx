import { Box, CircularProgress } from '@mui/material'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function RequireAuth({ allowedTypes }) {
  const location = useLocation()
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/auth?next=${next}`} replace />
  }

  if (Array.isArray(allowedTypes) && !allowedTypes.includes(user.userType)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RequireAuth
