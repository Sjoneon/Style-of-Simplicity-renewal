import { Alert, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { ITEM_SX } from '../../pages/mypage/myPageConfig'
import MyPageSectionCard from './MyPageSectionCard'

function MyPageAccountSection({
  expandedSection,
  onToggleSection,
  user,
  isUserAccount,
  isSellerAccount,
  loggingOut,
  onLogout,
  onGoSupport,
  onGoHome,
  accountError,
  accountSuccess,
  setAccountSuccess,
  profileForm,
  setProfileForm,
  onSubmitProfile,
  savingProfile,
  passwordForm,
  setPasswordForm,
  onSubmitPassword,
  savingPassword,
}) {
  return (
    <MyPageSectionCard
      sectionKey="account"
      title="6. 계정 관리"
      summaryText={user?.name || '-'}
      expandedSection={expandedSection}
      onToggle={onToggleSection}
    >
      <>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
          <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
            <Stack spacing={0.55}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography color="text.secondary">이름</Typography>
                <Typography fontWeight={700}>{user?.name || '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography color="text.secondary">연락 식별 정보</Typography>
                <Typography fontWeight={700}>{isSellerAccount ? (user?.businessNumber || '-') : (user?.email || '-')}</Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ ...ITEM_SX, flex: 1 }}>
            <Stack spacing={0.7}>
              <Button variant="outlined" onClick={onLogout} disabled={loggingOut}>
                {loggingOut ? '로그아웃 중...' : '로그아웃'}
              </Button>
              <Button variant="outlined" onClick={onGoSupport}>1:1 문의하기</Button>
              <Button variant="text" onClick={onGoHome} sx={{ px: 0 }}>홈으로 이동</Button>
            </Stack>
          </Paper>
        </Stack>

        <Divider />

        {accountError && <Alert severity="error">{accountError}</Alert>}
        {accountSuccess && (
          <Alert severity="success" onClose={() => setAccountSuccess('')}>
            {accountSuccess}
          </Alert>
        )}

        {isUserAccount ? (
          <Stack spacing={1}>
            <Paper variant="outlined" sx={ITEM_SX}>
              <Stack component="form" spacing={0.8} onSubmit={onSubmitProfile}>
                <Typography fontWeight={700}>회원정보 수정</Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
                  <TextField
                    label="이름"
                    size="small"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    fullWidth
                    required
                  />
                  <TextField
                    label="연락처"
                    size="small"
                    placeholder="010-1234-5678"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                    fullWidth
                    required
                  />
                </Stack>
                <Button type="submit" variant="outlined" disabled={savingProfile} sx={{ alignSelf: 'flex-start' }}>
                  {savingProfile ? '저장 중...' : '회원정보 저장'}
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={ITEM_SX}>
              <Stack component="form" spacing={0.8} onSubmit={onSubmitPassword}>
                <Typography fontWeight={700}>비밀번호 변경</Typography>
                <TextField
                  type="password"
                  label="현재 비밀번호"
                  size="small"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  fullWidth
                  required
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8}>
                  <TextField
                    type="password"
                    label="새 비밀번호"
                    size="small"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    fullWidth
                    required
                  />
                  <TextField
                    type="password"
                    label="새 비밀번호 확인"
                    size="small"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    fullWidth
                    required
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  새 비밀번호는 8~72자, 영문과 숫자를 각각 1자 이상 포함해야 합니다.
                </Typography>
                <Button type="submit" variant="outlined" disabled={savingPassword} sx={{ alignSelf: 'flex-start' }}>
                  {savingPassword ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">
            일반 사용자 계정에서 계정 수정 기능을 사용할 수 있습니다.
          </Typography>
        )}
      </>
    </MyPageSectionCard>
  )
}

export default MyPageAccountSection
