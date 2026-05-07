import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import resolveImageUrl from '../../utils/resolveImageUrl'
import {
  HOME_BANNER_MIN_SIZE_TEXT,
  HOME_BANNER_RATIO_TEXT,
  HOME_BANNER_RECOMMENDED_SIZE_TEXT,
} from '../../pages/seller-dashboard/sellerDashboardUtils'

function HomeBannerManager({
  bannerForm,
  setBannerForm,
  myProducts,
  banners,
  savingBanner,
  deletingBannerId,
  onSubmit,
  onReset,
  onDelete,
}) {
  return (
    <>
      <Paper component="form" onSubmit={onSubmit} sx={{ p: 2, borderRadius: 2.4 }}>
        <Stack spacing={1.2}>
          <Typography variant="h6" fontWeight={700}>메인 광고 배너 관리</Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              label="배너 제목(선택)"
              value={bannerForm.title}
              onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
              fullWidth
            />
            <TextField
              label="노출 순서(선택)"
              type="number"
              inputProps={{ min: 0 }}
              value={bannerForm.displayOrder}
              onChange={(event) => setBannerForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
              sx={{ minWidth: 180 }}
            />
          </Stack>

          <TextField
            label="배너 설명(선택)"
            value={bannerForm.subtitle}
            onChange={(event) => setBannerForm((prev) => ({ ...prev, subtitle: event.target.value }))}
            fullWidth
          />

          <TextField
            select
            label="연결 상품(선택)"
            value={bannerForm.targetProductId}
            onChange={(event) => setBannerForm((prev) => ({ ...prev, targetProductId: event.target.value }))}
            fullWidth
          >
            <MenuItem value="">선택 안함</MenuItem>
            {myProducts.map((product) => (
              <MenuItem key={`banner-product-${product.id}`} value={String(product.id)}>
                {product.name}
              </MenuItem>
            ))}
          </TextField>

          <Button component="label" variant="outlined" sx={{ width: 'fit-content' }}>
            배너 이미지 선택(필수)
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(event) =>
                setBannerForm((prev) => ({
                  ...prev,
                  imageFile: event.target.files?.[0] || null,
                }))
              }
            />
          </Button>

          <Typography variant="caption" color="text.secondary">
            권장 이미지: {HOME_BANNER_RECOMMENDED_SIZE_TEXT} (비율 {HOME_BANNER_RATIO_TEXT}, 최소 {HOME_BANNER_MIN_SIZE_TEXT})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            화면 비율에 따라 가장자리가 일부 잘릴 수 있어 핵심 피사체/문구는 중앙 배치를 권장합니다.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            선택한 배너 이미지: {bannerForm.imageFile?.name || '선택 안됨'}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" disabled={savingBanner}>배너 등록</Button>
            <Button type="button" color="inherit" onClick={onReset}>초기화</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2 }}>등록 배너 목록</Typography>
        {banners.length === 0 ? (
          <Typography color="text.secondary">등록된 배너가 없습니다.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>이미지</TableCell>
                  <TableCell>제목</TableCell>
                  <TableCell>연결 상품</TableCell>
                  <TableCell align="right">순서</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id} hover>
                    <TableCell>
                      {banner.imageUrl ? (
                        <Box
                          component="img"
                          src={resolveImageUrl(banner.imageUrl)}
                          alt={banner.title || '배너 이미지'}
                          sx={{ width: 66, height: 40, objectFit: 'cover', borderRadius: 1 }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{banner.title || '(제목 없음)'}</TableCell>
                    <TableCell>
                      {banner.targetProductId
                        ? myProducts.find((product) => Number(product.id) === Number(banner.targetProductId))?.name || `#${banner.targetProductId}`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">{banner.displayOrder ?? 0}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={deletingBannerId === banner.id}
                        onClick={() => onDelete(banner.id)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </>
  )
}

export default HomeBannerManager
