import { useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { requestAiStyling } from '../services/aiStylistApi'
import resolveImageUrl from '../utils/resolveImageUrl'

const numberFormatter = new Intl.NumberFormat('ko-KR')

const INITIAL_ASSISTANT_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: '원하는 스타일을 입력해 주세요. 예: 봄 출근룩 10만원 이하 추천해줘',
  recommendedProducts: [],
}

const HISTORY_MESSAGE_LIMIT = 8

const RESET_COMMANDS = new Set(['초기화', '자초기화', '리셋', 'reset', '대화초기화', '다시시작', '처음부터'])

function isResetCommand(input) {
  if (!input) {
    return false
  }
  const compact = input.replace(/\s+/g, '').toLowerCase()
  return RESET_COMMANDS.has(compact)
}

function AiStylistWidget() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [pending, setPending] = useState(false)
  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE])
  const nextMessageIdRef = useRef(2)

  // 일반 사용자/판매자 모두 로그인만 되어 있으면 AI 기능 사용 가능.
  const canUseAi = Boolean(user)
  const canSend = useMemo(
    () => canUseAi && !pending && inputValue.trim().length > 0,
    [canUseAi, inputValue, pending],
  )

  const appendMessage = (message) => {
    const id = nextMessageIdRef.current
    nextMessageIdRef.current += 1
    setMessages((prev) => [...prev, { id, ...message }])
  }

  const handleMoveToLogin = () => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    navigate(`/auth?next=${next}`)
    setOpen(false)
  }

  const handleSend = async () => {
    const message = inputValue.trim()
    if (!message || pending) {
      return
    }

    if (!canUseAi) {
      appendMessage({
        role: 'assistant',
        text: 'AI 추천은 로그인한 계정만 이용할 수 있습니다. 로그인 후 다시 시도해 주세요.',
        recommendedProducts: [],
      })
      setInputValue('')
      return
    }

    if (isResetCommand(message)) {
      nextMessageIdRef.current = 3
      setMessages([
        INITIAL_ASSISTANT_MESSAGE,
        {
          id: 2,
          role: 'assistant',
          text: '대화를 초기화했어요. 원하는 스타일을 다시 입력해 주세요.',
          recommendedProducts: [],
        },
      ])
      setInputValue('')
      return
    }

    appendMessage({ role: 'user', text: message, recommendedProducts: [] })
    setInputValue('')
    setPending(true)

    try {
      // 최근 대화 문맥을 함께 보내 후속 질문(예: "상의도 같이") 품질을 높인다.
      const history = messages
        .slice(-HISTORY_MESSAGE_LIMIT)
        .map((item) => ({ role: item.role, text: item.text }))
      const response = await requestAiStyling(message, history)
      appendMessage({
        role: 'assistant',
        text: response?.data?.reply || '요청은 처리됐지만 추천 응답을 생성하지 못했습니다.',
        recommendedProducts: response?.data?.recommendedProducts || [],
      })
    } catch (error) {
      const fallbackText = error?.response?.data?.message || 'AI 추천 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      appendMessage({
        role: 'assistant',
        text: fallbackText,
        recommendedProducts: [],
      })
    } finally {
      setPending(false)
    }
  }

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleMoveProduct = (productId) => {
    if (!productId) {
      return
    }
    navigate(`/products/${productId}`)
    setOpen(false)
  }

  return (
    <>
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            right: { xs: 12, md: 24 },
            bottom: { xs: 'calc(1.3cm + 20px)', md: 'calc(1.3cm + 24px)' },
            width: { xs: 'calc(100vw - 24px)', sm: 360 },
            maxWidth: 420,
            height: 500,
            zIndex: 1300,
            borderRadius: 2.5,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#ffffff',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 1.5, py: 1.2, bgcolor: '#111111', color: '#ffffff' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              AI 스타일 추천
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: '#ffffff' }}
              aria-label="AI 챗봇 닫기"
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.2, bgcolor: '#f8fafc' }}>
            <Stack spacing={1}>
              {messages.map((message) => (
                <Box key={message.id}>
                  <Box
                    sx={{
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      ml: message.role === 'user' ? 'auto' : 0,
                      px: 1.2,
                      py: 1,
                      borderRadius: 1.6,
                      bgcolor: message.role === 'user' ? '#111111' : '#ffffff',
                      color: message.role === 'user' ? '#ffffff' : '#0f172a',
                      border: message.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                      whiteSpace: 'pre-wrap',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {message.text}
                  </Box>

                  {message.role === 'assistant' && Array.isArray(message.recommendedProducts) && message.recommendedProducts.length > 0 && (
                    <Stack spacing={0.8} sx={{ mt: 0.8 }}>
                      {message.recommendedProducts.map((item) => (
                        <Box
                          key={`${message.id}-${item.productId}`}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '44px 1fr auto',
                            gap: 1,
                            alignItems: 'center',
                            p: 0.8,
                            borderRadius: 1.5,
                            border: '1px solid #e2e8f0',
                            bgcolor: '#ffffff',
                          }}
                        >
                          <Box
                            component="img"
                            src={resolveImageUrl(item.imageUrl)}
                            alt={item.productName}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 1,
                              objectFit: 'cover',
                              bgcolor: '#f1f5f9',
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }} noWrap>
                              {item.productName}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                              {item.category} · {numberFormatter.format(item.price)}원
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: '#475569' }} noWrap>
                              {item.reason}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleMoveProduct(item.productId)}
                            sx={{ minWidth: 56, fontSize: 11.5, px: 1 }}
                          >
                            보기
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}

              {pending && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.6, py: 0.2 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    추천 생성 중
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          <Divider />

          <Box sx={{ p: 1 }}>
            {!canUseAi && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1, p: 1, borderRadius: 1.2, bgcolor: '#f1f5f9' }}
              >
                <Typography sx={{ fontSize: 12.5, color: '#334155' }}>
                  AI 추천은 로그인한 계정만 이용할 수 있습니다.
                </Typography>
                <Button size="small" variant="outlined" onClick={handleMoveToLogin}>
                  로그인
                </Button>
              </Stack>
            )}

            <TextField
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              placeholder="원하는 스타일을 입력해 주세요."
              value={inputValue}
              disabled={!canUseAi}
              onChange={(event) => setInputValue(event.target.value.slice(0, 180))}
              onKeyDown={handleInputKeyDown}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: 13.5,
                  bgcolor: '#ffffff',
                },
              }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.8 }}>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                의류/코디 추천 전용
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={handleSend}
                disabled={!canSend}
                endIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
              >
                전송
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      <IconButton
        onClick={() => setOpen((prev) => !prev)}
        aria-label="AI 스타일 챗봇 열기"
        sx={{
          position: 'fixed',
          right: { xs: 12, md: 24 },
          bottom: { xs: 12, md: 24 },
          zIndex: 1301,
          width: '1.3cm',
          height: '1.3cm',
          borderRadius: '50%',
          bgcolor: '#111111',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 10px 24px rgba(15,23,42,0.26)',
          '&:hover': {
            bgcolor: '#0b1220',
          },
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em' }}>
          AI
        </Typography>
      </IconButton>
    </>
  )
}

export default AiStylistWidget
