import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import resolveImageUrl from '../../utils/resolveImageUrl'

const INQUIRY_STATUS_LABELS = {
  answered: '답변 된 문의',
  pending: '미답변된 문의',
}

function InquiriesTabPanel({
  visibleInquiries,
  inquiryAnswerFilter,
  answeredInquiryCount,
  unansweredInquiryCount,
  inquiryCategoryFilter,
  setInquiryCategoryFilter,
  inquiryCategoryFilterOptions,
  inquiryDrafts,
  setInquiryDrafts,
  savingInquiryId,
  deletingInquiryId,
  onSaveInquiry,
  onDeleteInquiry,
  getInquiryCategoryLabel,
  formatDateTime,
}) {
  return (
    <Stack spacing={1.5}>
      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Stack spacing={0.4}>
              <Typography variant="h6" fontWeight={700}>{INQUIRY_STATUS_LABELS[inquiryAnswerFilter]}</Typography>
              <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={`답변 완료 ${answeredInquiryCount}건`} />
                <Chip size="small" variant="outlined" color="warning" label={`미답변 ${unansweredInquiryCount}건`} />
              </Stack>
            </Stack>
          </Stack>

          <TextField
            select
            size="small"
            label="카테고리 필터"
            value={inquiryCategoryFilter}
            onChange={(event) => setInquiryCategoryFilter(event.target.value)}
            sx={{ width: { xs: '100%', md: 260 } }}
          >
            {inquiryCategoryFilterOptions.map((option) => (
              <MenuItem key={`seller-inquiry-category-${option.value}`} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {visibleInquiries.length === 0 ? (
        <Paper sx={{ p: 2, borderRadius: 2.4 }}>
          <Typography color="text.secondary">표시할 문의가 없습니다.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.2}>
          {visibleInquiries.map((inquiry) => (
            <Paper key={inquiry.id} sx={{ p: 1.6, borderRadius: 2.2 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
                  <Typography fontWeight={700}>#{inquiry.id} {inquiry.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatDateTime(inquiry.createdDate)}</Typography>
                </Stack>

                <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip size="small" variant="outlined" color="primary" label={getInquiryCategoryLabel(inquiry.category)} />
                  <Chip
                    size="small"
                    variant="outlined"
                    color={String(inquiry.answer || '').trim() ? 'success' : 'warning'}
                    label={String(inquiry.answer || '').trim() ? '답변 완료' : '미답변'}
                  />
                  <Typography variant="body2" color="text.secondary">
                    작성자: {inquiry.userName || inquiry.userId} / 상품ID: {inquiry.productId ?? '-'}
                  </Typography>
                </Stack>

                <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.6 }}>
                  <Typography variant="body2">{inquiry.content}</Typography>
                </Paper>

                {inquiry.imageUrl && (
                  <Box
                    component="img"
                    src={resolveImageUrl(inquiry.imageUrl)}
                    alt={`문의 #${inquiry.id} 첨부 이미지`}
                    sx={{
                      width: 180,
                      maxWidth: '100%',
                      borderRadius: 1.6,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                )}

                <TextField
                  label="답변"
                  multiline
                  minRows={3}
                  value={inquiryDrafts[inquiry.id] ?? ''}
                  onChange={(event) =>
                    setInquiryDrafts((prev) => ({
                      ...prev,
                      [inquiry.id]: event.target.value,
                    }))
                  }
                  fullWidth
                />

                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={savingInquiryId === inquiry.id}
                    onClick={() => onSaveInquiry(inquiry)}
                  >
                    {String(inquiry.answer || '').trim() ? '답변 수정' : '답변 등록'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={deletingInquiryId === inquiry.id}
                    onClick={() => onDeleteInquiry(inquiry.id)}
                  >
                    문의 삭제
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export default InquiriesTabPanel
