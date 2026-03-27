import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../services/api'
import {
  fetchMyNotifications,
  fetchMyNotificationSummary,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
} from '../services/notificationApi'

const SECTION_SX = {
  p: { xs: 1.7, md: 2 },
  borderRadius: 2,
  border: '1px solid',
  borderColor: '#e8e8e8',
  boxShadow: 'none',
  bgcolor: '#ffffff',
}

const ITEM_SX = {
  p: 1.2,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: '#ededed',
  bgcolor: '#fafafa',
}

const EMPTY_SUMMARY = {
  total: 0,
  unread: 0,
  [NOTIFICATION_TYPES.RESTOCK]: 0,
  [NOTIFICATION_TYPES.DISCOUNT]: 0,
  [NOTIFICATION_TYPES.ORDER_STATUS]: 0,
  [NOTIFICATION_TYPES.INQUIRY_ANSWER]: 0,
}

const FILTER_OPTIONS = [
  { value: NOTIFICATION_TYPES.ALL, label: '전체' },
  { value: NOTIFICATION_TYPES.RESTOCK, label: '재입고' },
  { value: NOTIFICATION_TYPES.DISCOUNT, label: '할인' },
  { value: NOTIFICATION_TYPES.ORDER_STATUS, label: '주문 상태' },
  { value: NOTIFICATION_TYPES.INQUIRY_ANSWER, label: '문의 답변' },
]

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return String(value).replace('T', ' ').slice(0, 16)
}

function normalizeSummary(data, notifications) {
  const base = { ...EMPTY_SUMMARY }
  const list = Array.isArray(notifications) ? notifications : []

  const fallback = list.reduce(
    (acc, current) => {
      const type = String(current?.type || '').trim()
      if (type && acc[type] !== undefined) {
        acc[type] += 1
      }
      if (!current?.read) {
        acc.unread += 1
      }
      acc.total += 1
      return acc
    },
    { ...base },
  )

  if (!data || typeof data !== 'object') {
    return fallback
  }

  return {
    total: Number(data.total ?? fallback.total) || fallback.total,
    unread: Number(data.unread ?? fallback.unread) || fallback.unread,
    [NOTIFICATION_TYPES.RESTOCK]:
      Number(data[NOTIFICATION_TYPES.RESTOCK] ?? fallback[NOTIFICATION_TYPES.RESTOCK]) ||
      fallback[NOTIFICATION_TYPES.RESTOCK],
    [NOTIFICATION_TYPES.DISCOUNT]:
      Number(data[NOTIFICATION_TYPES.DISCOUNT] ?? fallback[NOTIFICATION_TYPES.DISCOUNT]) ||
      fallback[NOTIFICATION_TYPES.DISCOUNT],
    [NOTIFICATION_TYPES.ORDER_STATUS]:
      Number(data[NOTIFICATION_TYPES.ORDER_STATUS] ?? fallback[NOTIFICATION_TYPES.ORDER_STATUS]) ||
      fallback[NOTIFICATION_TYPES.ORDER_STATUS],
    [NOTIFICATION_TYPES.INQUIRY_ANSWER]:
      Number(data[NOTIFICATION_TYPES.INQUIRY_ANSWER] ?? fallback[NOTIFICATION_TYPES.INQUIRY_ANSWER]) ||
      fallback[NOTIFICATION_TYPES.INQUIRY_ANSWER],
  }
}

function NotificationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, authLoading, refreshSession } = useAuth()
  const redirectingRef = useRef(false)

  const [notifications, setNotifications] = useState([])
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [filter, setFilter] = useState(NOTIFICATION_TYPES.ALL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canUseNotifications = user?.userType === 'user'

  const moveToLogin = useCallback(() => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`, { replace: true })
  }, [location.pathname, location.search, navigate])

  const handleUnauthorized = useCallback(
    async (err) => {
      if (err?.response?.status !== 401) {
        return false
      }

      if (redirectingRef.current) {
        return true
      }
      redirectingRef.current = true

      setError('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.')
      setNotifications([])
      setSummary(EMPTY_SUMMARY)

      await refreshSession()
      moveToLogin()
      return true
    },
    [moveToLogin, refreshSession],
  )

  const loadNotifications = useCallback(async () => {
    if (!canUseNotifications || !user?.id) {
      setNotifications([])
      setSummary(EMPTY_SUMMARY)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [notificationsResponse, summaryResponse] = await Promise.all([
        fetchMyNotifications(),
        fetchMyNotificationSummary(),
      ])
      const nextNotifications = Array.isArray(notificationsResponse?.data)
        ? notificationsResponse.data
        : []
      setNotifications(nextNotifications)
      setSummary(normalizeSummary(summaryResponse?.data, nextNotifications))
    } catch (err) {
      if (!(await handleUnauthorized(err))) {
        setError(getApiErrorMessage(err, '알림을 불러오지 못했습니다.'))
      }
    } finally {
      setLoading(false)
    }
  }, [canUseNotifications, handleUnauthorized, user?.id])

  useEffect(() => {
    setFilter(NOTIFICATION_TYPES.ALL)
    loadNotifications()
  }, [loadNotifications])

  const visibleNotifications = useMemo(() => {
    if (filter === NOTIFICATION_TYPES.ALL) {
      return notifications
    }
    return notifications.filter((notification) => notification.type === filter)
  }, [filter, notifications])

  const handleMarkRead = async (notificationId) => {
    if (!canUseNotifications || !user?.id || !notificationId) {
      return
    }

    setError('')
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((previous) =>
        previous.map((notification) => {
          if (notification.id !== notificationId) {
            return notification
          }
          return {
            ...notification,
            read: true,
          }
        }),
      )
      setSummary((previous) => ({
        ...previous,
        unread: Math.max(Number(previous.unread || 0) - 1, 0),
      }))
    } catch (err) {
      if (!(await handleUnauthorized(err))) {
        setError(getApiErrorMessage(err, '알림 읽음 처리에 실패했습니다.'))
      }
    }
  }

  const handleMarkAllRead = async () => {
    if (!canUseNotifications || !user?.id) {
      return
    }

    setError('')
    try {
      await markAllNotificationsAsRead()
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        })),
      )
      setSummary((previous) => ({
        ...previous,
        unread: 0,
      }))
    } catch (err) {
      if (!(await handleUnauthorized(err))) {
        setError(getApiErrorMessage(err, '전체 읽음 처리에 실패했습니다.'))
      }
    }
  }

  const moveToNotificationTarget = (notification) => {
    if (notification?.productId) {
      navigate(`/products/${notification.productId}`)
      return
    }

    if (notification?.orderId) {
      navigate('/mypage')
      return
    }

    if (notification?.inquiryId) {
      navigate('/support')
    }
  }

  return (
    <Stack spacing={1.2}>
      <Paper sx={SECTION_SX}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={800}>알림</Typography>
            {canUseNotifications && (
              <Button variant="text" onClick={loadNotifications} disabled={loading} sx={{ px: 0 }}>
                새로고침
              </Button>
            )}
          </Stack>
          <Typography color="text.secondary">
            재입고, 할인, 주문 상태 변경, 문의 답변 알림을 확인할 수 있습니다.
          </Typography>
        </Stack>
      </Paper>

      {authLoading ? (
        <Paper sx={SECTION_SX}>
          <Stack alignItems="center" spacing={1} sx={{ py: 2 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">세션을 확인하고 있습니다.</Typography>
          </Stack>
        </Paper>
      ) : (
        <>
          {error && <Alert severity="error">{error}</Alert>}

          {!user ? (
            <Paper sx={SECTION_SX}>
              <Stack spacing={1}>
                <Typography fontWeight={700}>로그인이 필요합니다.</Typography>
                <Typography color="text.secondary">
                  알림은 로그인한 사용자 계정에서 확인할 수 있습니다.
                </Typography>
                <Button variant="contained" onClick={moveToLogin} sx={{ alignSelf: 'flex-start' }}>
                  로그인하러 가기
                </Button>
              </Stack>
            </Paper>
          ) : !canUseNotifications ? (
            <Paper sx={SECTION_SX}>
              <Typography color="text.secondary">
                현재 알림 기능은 일반 사용자 계정에서만 제공됩니다.
              </Typography>
            </Paper>
          ) : (
            <>
              <Paper sx={SECTION_SX}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                    <Chip size="small" variant="outlined" label={`전체 ${summary.total}건`} />
                    <Chip size="small" variant="outlined" label={`미읽음 ${summary.unread}건`} />
                    <Chip size="small" variant="outlined" label={`재입고 ${summary[NOTIFICATION_TYPES.RESTOCK]}건`} />
                    <Chip size="small" variant="outlined" label={`할인 ${summary[NOTIFICATION_TYPES.DISCOUNT]}건`} />
                    <Chip size="small" variant="outlined" label={`주문 상태 ${summary[NOTIFICATION_TYPES.ORDER_STATUS]}건`} />
                    <Chip size="small" variant="outlined" label={`문의 답변 ${summary[NOTIFICATION_TYPES.INQUIRY_ANSWER]}건`} />
                  </Stack>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
                      {FILTER_OPTIONS.map((option) => (
                        <Chip
                          key={option.value}
                          label={option.label}
                          color={filter === option.value ? 'primary' : 'default'}
                          variant={filter === option.value ? 'filled' : 'outlined'}
                          onClick={() => setFilter(option.value)}
                          clickable
                        />
                      ))}
                    </Stack>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleMarkAllRead}
                      disabled={notifications.length === 0}
                      sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                    >
                      전체 읽음
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={SECTION_SX}>
                {loading ? (
                  <Stack alignItems="center" sx={{ py: 3 }}>
                    <CircularProgress size={22} />
                  </Stack>
                ) : visibleNotifications.length === 0 ? (
                  <Typography color="text.secondary">
                    {filter === NOTIFICATION_TYPES.ALL
                      ? '표시할 알림이 없습니다.'
                      : '선택한 유형의 알림이 없습니다.'}
                  </Typography>
                ) : (
                  <Stack spacing={0.9}>
                    {visibleNotifications.map((notification) => {
                      const isRead = Boolean(notification.read)
                      const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] || notification.type

                      return (
                        <Paper key={notification.id} variant="outlined" sx={ITEM_SX}>
                          <Stack spacing={0.55}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.5}>
                              <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Chip size="small" variant="outlined" label={typeLabel} />
                                {!isRead && <Chip size="small" color="primary" label="새 알림" />}
                                <Typography fontWeight={700}>{notification.title}</Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(notification.createdDate)}
                              </Typography>
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>

                            <Stack direction="row" spacing={0.7}>
                              {!isRead && (
                                <Button size="small" variant="outlined" onClick={() => handleMarkRead(notification.id)}>
                                  읽음 처리
                                </Button>
                              )}
                              {(notification.productId || notification.orderId || notification.inquiryId) && (
                                <Button size="small" variant="text" onClick={() => moveToNotificationTarget(notification)}>
                                  관련 화면 이동
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      )
                    })}
                  </Stack>
                )}
              </Paper>
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default NotificationsPage
