import { Alert, Button, Chip, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { ITEM_SX } from '../../pages/mypage/myPageConfig'
import { formatDateTime } from '../../pages/mypage/myPageUtils'
import MyPageSectionCard from './MyPageSectionCard'

function MyPageReviewsSection({
  expandedSection,
  onToggleSection,
  isUserAccount,
  reviewSummary,
  inquirySummary,
  reviewError,
  reviewSuccess,
  setReviewSuccess,
  reviewForm,
  setReviewForm,
  onReviewSubmit,
  savingReview,
  reviewableOrders,
  recentReviews,
  recentInquiries,
  onGoProduct,
  onGoSupport,
}) {
  return (
    <MyPageSectionCard
      sectionKey="reviews"
      title="4. 리뷰/문의 내역"
      summaryText={`리뷰 ${reviewSummary.total}건 · 문의 ${inquirySummary.total}건`}
      expandedSection={expandedSection}
      onToggle={onToggleSection}
    >
      <>
        <Paper variant="outlined" sx={ITEM_SX}>
          <Stack spacing={0.8}>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography fontWeight={700}>내 리뷰</Typography>
              <Chip size="small" variant="outlined" label={`총 ${reviewSummary.total}건`} />
              <Chip size="small" variant="outlined" label={`평균 ${reviewSummary.total > 0 ? reviewSummary.average.toFixed(1) : '0.0'}점`} />
            </Stack>

            {reviewError && <Alert severity="error">{reviewError}</Alert>}
            {reviewSuccess && (
              <Alert severity="success" onClose={() => setReviewSuccess('')}>
                {reviewSuccess}
              </Alert>
            )}

            {!isUserAccount ? (
              <Typography color="text.secondary" variant="body2">
                일반 사용자 계정에서 리뷰를 작성/조회할 수 있습니다.
              </Typography>
            ) : (
              <Stack component="form" spacing={0.75} onSubmit={onReviewSubmit}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.7}>
                  <TextField
                    select
                    size="small"
                    label="주문 선택"
                    value={reviewForm.orderId}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, orderId: event.target.value }))}
                    sx={{ minWidth: 220, flex: 1 }}
                    required
                  >
                    {reviewableOrders.length === 0 ? (
                      <MenuItem value="" disabled>작성 가능한 주문이 없습니다.</MenuItem>
                    ) : (
                      reviewableOrders.map((order) => (
                        <MenuItem key={order.id} value={String(order.id)}>{order.label}</MenuItem>
                      ))
                    )}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="평점"
                    value={reviewForm.rating}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}
                    sx={{ width: { xs: '100%', md: 120 } }}
                    required
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <MenuItem key={rating} value={String(rating)}>{`${rating}점`}</MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <TextField
                  label="리뷰 내용"
                  size="small"
                  multiline
                  minRows={2}
                  maxRows={4}
                  value={reviewForm.content}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, content: event.target.value }))}
                  inputProps={{ maxLength: 1000 }}
                  placeholder="상품 사용 경험을 간단히 남겨주세요."
                  required
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">{`${String(reviewForm.content || '').length}/1000`}</Typography>
                  <Button type="submit" variant="outlined" disabled={savingReview || reviewableOrders.length === 0}>
                    {savingReview ? '등록 중...' : '리뷰 등록'}
                  </Button>
                </Stack>
              </Stack>
            )}

            <Divider />

            {recentReviews.length === 0 ? (
              <Typography color="text.secondary" variant="body2">등록된 리뷰가 없습니다.</Typography>
            ) : (
              <Stack spacing={0.55}>
                {recentReviews.map((review) => (
                  <Stack key={review.id} spacing={0.15}>
                    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap alignItems="center">
                      <Typography variant="body2" fontWeight={700}>#{review.orderId} {review.productName || '상품명 없음'}</Typography>
                      <Chip size="small" variant="outlined" label={`${review.rating || 0}점`} />
                      <Typography variant="caption" color="text.secondary">{formatDateTime(review.createdDate)}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{review.content}</Typography>
                    {review.productId && (
                      <Button variant="text" size="small" onClick={() => onGoProduct(review.productId)} sx={{ alignSelf: 'flex-start', px: 0 }}>
                        상품 보기
                      </Button>
                    )}
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={ITEM_SX}>
          <Stack spacing={0.8}>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              <Chip size="small" variant="outlined" label={`문의 전체 ${inquirySummary.total}건`} />
              <Chip size="small" variant="outlined" label={`답변 대기 ${inquirySummary.pending}건`} />
              <Chip size="small" variant="outlined" label={`답변 완료 ${inquirySummary.answered}건`} />
            </Stack>

            {!isUserAccount ? (
              <Typography color="text.secondary" variant="body2">일반 사용자 계정에서 문의 내역을 조회할 수 있습니다.</Typography>
            ) : recentInquiries.length === 0 ? (
              <Typography color="text.secondary" variant="body2">등록된 문의가 없습니다.</Typography>
            ) : (
              <Stack spacing={0.55}>
                {recentInquiries.map((inquiry) => (
                  <Stack key={inquiry.id} spacing={0.1}>
                    <Typography variant="body2" fontWeight={700}>#{inquiry.id} {inquiry.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {String(inquiry.answer || '').trim() ? '답변 완료' : '답변 대기'} · {formatDateTime(inquiry.createdDate)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            <Button variant="outlined" onClick={onGoSupport} sx={{ alignSelf: 'flex-start' }}>
              고객센터 이동
            </Button>
          </Stack>
        </Paper>
      </>
    </MyPageSectionCard>
  )
}

export default MyPageReviewsSection
