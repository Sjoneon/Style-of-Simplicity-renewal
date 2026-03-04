import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../services/userApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    setAuthLoading(true)
    try {
      const response = await fetchCurrentUser()
      setUser(response.data || null)
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error('Failed to refresh session', error)
      }
      setUser(null)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials)
    setUser(response.data || null)
    return response.data
  }, [])

  const register = useCallback(async (payload) => {
    return registerUser(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isLoggedIn: Boolean(user),
      isUser: user?.userType === 'user',
      isSeller: user?.userType === 'seller',
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, authLoading, login, register, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
