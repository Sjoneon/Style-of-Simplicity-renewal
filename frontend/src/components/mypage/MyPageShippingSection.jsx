import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { ITEM_SX } from '../../pages/mypage/myPageConfig'
import MyPageSectionCard from './MyPageSectionCard'

function MyPageShippingSection({
  expandedSection,
  onToggleSection,
  isUserAccount,
  resolvedAddressValue,
  accountError,
  accountSuccess,
  setAccountSuccess,
  addressForm,
  setAddressForm,
  openingAddressSearch,
  savingAddress,
  onOpenAddressSearch,
  onSubmitAddress,
}) {
  return (
    <MyPageSectionCard
      sectionKey="shipping"
      title="5. 배송지 관리"
      summaryText={resolvedAddressValue ? '기본 배송지 등록됨' : '배송지 미등록'}
      expandedSection={expandedSection}
      onToggle={onToggleSection}
    >
      <>
        {accountError && <Alert severity="error">{accountError}</Alert>}
        {accountSuccess && (
          <Alert severity="success" onClose={() => setAccountSuccess('')}>
            {accountSuccess}
          </Alert>
        )}

        {isUserAccount ? (
          <Paper variant="outlined" sx={ITEM_SX}>
            <Stack component="form" spacing={0.8} onSubmit={onSubmitAddress}>
              <Typography fontWeight={700}>배송지 수정</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <TextField label="우편번호" size="small" value={addressForm.postcode} fullWidth InputProps={{ readOnly: true }} />
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onOpenAddressSearch}
                  disabled={openingAddressSearch}
                  sx={{ minWidth: { xs: '100%', sm: 120 } }}
                >
                  {openingAddressSearch ? '검색 중...' : '주소 검색'}
                </Button>
              </Stack>
              <TextField
                label="기본 주소"
                size="small"
                value={addressForm.address}
                onChange={(event) => setAddressForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="주소 검색 버튼으로 입력하세요."
                fullWidth
                required
              />
              <TextField
                label="상세 주소"
                size="small"
                value={addressForm.detailAddress}
                onChange={(event) => setAddressForm((prev) => ({ ...prev, detailAddress: event.target.value }))}
                placeholder="동/호수, 건물명 등"
                fullWidth
              />
              {resolvedAddressValue && (
                <Typography variant="caption" color="text.secondary">저장 예정 주소: {resolvedAddressValue}</Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                주소 검색으로 기본 주소를 선택하고 상세 주소를 입력해 주세요.
              </Typography>
              <Button type="submit" variant="outlined" disabled={savingAddress || openingAddressSearch} sx={{ alignSelf: 'flex-start' }}>
                {savingAddress ? '저장 중...' : '배송지 저장'}
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Typography color="text.secondary" variant="body2">
            일반 사용자 계정에서 배송지 관리 기능을 사용할 수 있습니다.
          </Typography>
        )}
      </>
    </MyPageSectionCard>
  )
}

export default MyPageShippingSection
