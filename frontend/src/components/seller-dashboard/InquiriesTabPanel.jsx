import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import resolveImageUrl from '../../utils/resolveImageUrl'

function InquiriesTabPanel({
  visibleInquiries,
  inquiryOnlyPending,
  setInquiryOnlyPending,
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
            <Typography variant="h6" fontWeight={700}>사용자 Q&A 관리</Typography>
            <FormControlLabel
              control={(
                <Switch
                  checked={inquiryOnlyPending}
                  onChange={(event) => setInquiryOnlyPending(event.target.checked)}
                />
              )}
              label="미답변만 보기"
            />
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
