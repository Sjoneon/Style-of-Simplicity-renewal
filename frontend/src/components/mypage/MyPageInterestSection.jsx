import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import resolveImageUrl from '../../utils/resolveImageUrl'
import { ITEM_SX } from '../../pages/mypage/myPageConfig'
import { formatDateTime, formatPrice } from '../../pages/mypage/myPageUtils'
import MyPageSectionCard from './MyPageSectionCard'

function MyPageInterestSection({
  expandedSection,
  onToggleSection,
  isUserAccount,
  loading,
  wishlistItems,
  recentViewedItems,
  removingWishlistProductId,
  onRemoveWishlist,
  onGoHome,
  onGoProduct,
}) {
  return (
    <MyPageSectionCard
      sectionKey="interest"
      title="3. 찜/최근 본"
      summaryText={`찜 ${wishlistItems.length}건`}
      expandedSection={expandedSection}
      onToggle={onToggleSection}
    >
      {!isUserAccount ? (
        <Typography color="text.secondary" variant="body2">
          일반 사용자 계정에서 찜 목록을 사용할 수 있습니다.
        </Typography>
      ) : (
        <Stack spacing={0.8}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={20} />
            </Stack>
          ) : wishlistItems.length === 0 ? (
            <Paper variant="outlined" sx={ITEM_SX}>
              <Stack spacing={0.6}>
                <Typography color="text.secondary">찜한 상품이 없습니다.</Typography>
                <Button variant="text" onClick={onGoHome} sx={{ alignSelf: 'flex-start', px: 0 }}>
                  상품 둘러보기
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={0.7}>
              {wishlistItems.map((item) => {
                const imageSrc = resolveImageUrl(item.imageUrl)
                return (
                  <Paper key={item.id} variant="outlined" sx={ITEM_SX}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      spacing={0.8}
                    >
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 1.2,
                            bgcolor: '#f2f2f2',
                            border: '1px solid #e5e5e5',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {imageSrc && (
                            <Box
                              component="img"
                              src={imageSrc}
                              alt={item.name || '상품 이미지'}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </Box>
                        <Stack spacing={0.2}>
                          <Typography fontWeight={700}>{item.name || '상품명 없음'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(item.category || '미분류')} · {formatPrice(item.price)}원
                          </Typography>
                        </Stack>
                      </Stack>

                      <Stack direction="row" spacing={0.6}>
                        <Button variant="text" onClick={() => onGoProduct(item.id)}>상품 보기</Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => onRemoveWishlist(item.id)}
                          disabled={removingWishlistProductId === item.id}
                        >
                          {removingWishlistProductId === item.id ? '해제 중...' : '찜 해제'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              })}
            </Stack>
          )}

          <Paper variant="outlined" sx={ITEM_SX}>
            <Stack spacing={0.8}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={700}>최근 본 상품</Typography>
                <Typography variant="caption" color="text.secondary">총 {recentViewedItems.length}건</Typography>
              </Stack>

              {recentViewedItems.length === 0 ? (
                <Typography color="text.secondary" variant="body2">최근 본 상품이 없습니다.</Typography>
              ) : (
                <Stack spacing={0.55}>
                  {recentViewedItems.slice(0, 5).map((item) => (
                    <Stack
                      key={`recent-${item.id}-${item.viewedDate || ''}`}
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      spacing={0.4}
                    >
                      <Stack spacing={0.1}>
                        <Typography variant="body2" fontWeight={700}>{item.name || '상품명 없음'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(item.category || '미분류')} · {formatPrice(item.price)}원
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          마지막 조회: {formatDateTime(item.viewedDate)}
                        </Typography>
                      </Stack>
                      <Button variant="text" onClick={() => onGoProduct(item.id)} sx={{ px: 0 }}>
                        상품 보기
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      )}
    </MyPageSectionCard>
  )
}

export default MyPageInterestSection
