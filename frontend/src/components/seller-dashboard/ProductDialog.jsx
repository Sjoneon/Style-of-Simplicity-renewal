import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { CATEGORY_OPTIONS, parseOptionSpecs, sanitizeDiscoveryTabKeys } from '../../pages/seller-dashboard/sellerDashboardUtils'

function ProductDialog({
  mode,
  open,
  onClose,
  onSubmit,
  saving,
  errorMessage,
  form,
  setForm,
  assignableDiscoveryTabs,
  onToggleDiscoveryTab,
}) {
  const isCreate = mode === 'create'

  const handleOptionChange = (nextText) => {
    let nextQuantity = ''
    try {
      const parsed = parseOptionSpecs(nextText)
      nextQuantity = parsed.length
        ? String(parsed.reduce((sum, option) => sum + Number(option.quantity || 0), 0))
        : ''
    } catch {
      nextQuantity = ''
    }

    setForm((prev) => ({
      ...prev,
      optionSpecsText: nextText,
      quantity: nextQuantity,
    }))
  }

  const handleSubmit = (event) => {
    if (!isCreate) {
      return
    }
    onSubmit(event)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Stack component={isCreate ? 'form' : 'div'} onSubmit={isCreate ? handleSubmit : undefined}>
        <DialogTitle>{isCreate ? '상품 등록' : '상품 수정'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ pt: 0.6 }}>
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                label="상품명"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required={isCreate}
                fullWidth
              />
              <TextField
                select
                label="카테고리"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                sx={{ minWidth: 180 }}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                label="가격"
                type="number"
                inputProps={{ min: 0 }}
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                required={isCreate}
                fullWidth
              />
              <TextField
                label="정상가(선택)"
                type="number"
                inputProps={{ min: 0 }}
                value={form.originalPrice}
                onChange={(event) => setForm((prev) => ({ ...prev, originalPrice: event.target.value }))}
                fullWidth
              />
              <TextField
                label="총 재고(사이즈 합계)"
                value={form.quantity}
                InputProps={{ readOnly: true }}
                placeholder="사이즈 입력 시 자동 계산"
                fullWidth
              />
              {isCreate && (
                <TextField
                  label="상황 점수(선택)"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={form.situationScore}
                  onChange={(event) => setForm((prev) => ({ ...prev, situationScore: event.target.value }))}
                  fullWidth
                />
              )}
            </Stack>

            <TextField
              label="사이즈별 재고(필수)"
              placeholder="S:10, M:5, L:0"
              value={form.optionSpecsText}
              onChange={(event) => handleOptionChange(event.target.value)}
              required={isCreate}
              fullWidth
            />

            <TextField
              label="설명"
              multiline
              minRows={2}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              fullWidth
            />

            <TextField
              label="키워드(쉼표로 구분)"
              placeholder="입문,기본템,출근룩"
              value={form.keywordsText}
              onChange={(event) => setForm((prev) => ({ ...prev, keywordsText: event.target.value }))}
              fullWidth
            />

            <Paper variant="outlined" sx={{ p: 1.1, borderRadius: 1.6 }}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.4 }}>
                홈 탐색 탭 연결
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>
                이 상품이 노출될 탭을 선택해 주세요.
              </Typography>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                {assignableDiscoveryTabs.map((tab) => (
                  <FormControlLabel
                    key={`${mode}-discovery-${tab.tabKey}`}
                    control={(
                      <Switch
                        checked={sanitizeDiscoveryTabKeys(form.discoveryTabKeys).includes(tab.tabKey)}
                        onChange={(event) => onToggleDiscoveryTab(tab.tabKey, event.target.checked)}
                      />
                    )}
                    label={tab.label}
                  />
                ))}
              </Stack>
              {assignableDiscoveryTabs.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  활성화된 탐색 탭이 없습니다. 먼저 탭을 추가하거나 활성화해 주세요.
                </Typography>
              )}
            </Paper>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Button component="label" variant="outlined" color={isCreate ? 'primary' : 'inherit'}>
                {isCreate ? '대표 이미지 선택(필수)' : '교체할 대표 이미지 선택(선택)'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      imageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </Button>
              <Button component="label" variant="outlined" color="inherit">
                {isCreate ? '상세 이미지 선택(선택)' : '교체할 상세 이미지 선택(선택)'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      descriptionImageFile: event.target.files?.[0] || null,
                    }))
                  }
                />
              </Button>
            </Stack>

            {!form.descriptionImageFile && isCreate && (
              <Alert severity="warning">
                상세 이미지가 없으면 상세페이지 설득력이 떨어질 수 있습니다. 가능하면 착용컷/디테일컷 1장 이상 등록해 주세요.
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary">
              대표 이미지: {form.imageFile?.name || '선택 안됨'} / 상세 이미지: {form.descriptionImageFile?.name || '선택 안됨'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.2, pb: 2 }}>
          <Button type="button" onClick={onClose} color="inherit">취소</Button>
          <Button
            type={isCreate ? 'submit' : 'button'}
            variant="contained"
            disabled={saving}
            onClick={isCreate ? undefined : onSubmit}
          >
            {isCreate ? '상품 등록' : '수정 저장'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}

export default ProductDialog
