import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'

function HomeSearchDialog({
  open,
  onClose,
  draftQuery,
  setDraftQuery,
  draftOnlyInStock,
  setDraftOnlyInStock,
  searchHistory,
  popularTerms,
  onApplySearch,
}) {
  const handleApply = () => {
    onApplySearch({
      nextQuery: draftQuery,
      nextOnlyInStock: draftOnlyInStock,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>상품 검색</DialogTitle>
      <DialogContent>
        <Stack spacing={1.3} sx={{ pt: 0.7 }}>
          <TextField
            autoFocus
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            label="검색어"
            placeholder="상품명 또는 설명"
            fullWidth
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleApply()
              }
            }}
          />

          <FormControlLabel
            control={(
              <Switch
                checked={draftOnlyInStock}
                onChange={(event) => setDraftOnlyInStock(event.target.checked)}
                color="primary"
              />
            )}
            label="재고 있는 상품만 보기"
          />

          {searchHistory.length > 0 && (
            <Stack spacing={0.7}>
              <Typography variant="caption" color="text.secondary">최근 검색어</Typography>
              <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                {searchHistory.map((term) => (
                  <Chip
                    key={`history-${term}`}
                    label={term}
                    variant="outlined"
                    clickable
                    onClick={() => setDraftQuery(term)}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {popularTerms.length > 0 && (
            <Stack spacing={0.7}>
              <Typography variant="caption" color="text.secondary">인기 검색어</Typography>
              <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                {popularTerms.map((term) => (
                  <Chip
                    key={`popular-${term}`}
                    label={term}
                    variant="outlined"
                    clickable
                    onClick={() => setDraftQuery(term)}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.2 }}>
        <Button onClick={onClose} color="inherit">닫기</Button>
        <Button variant="contained" onClick={handleApply}>검색 적용</Button>
      </DialogActions>
    </Dialog>
  )
}

export default HomeSearchDialog
