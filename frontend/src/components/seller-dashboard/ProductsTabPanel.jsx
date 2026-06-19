import {
  Box,
  Button,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import resolveImageUrl from '../../utils/resolveImageUrl'

function ProductsTabPanel({
  myProducts,
  visibleProducts,
  filteredProductsCount,
  productCategoryFilterOptions,
  productCategoryFilter,
  setProductCategoryFilter,
  productSortOrder,
  setProductSortOrder,
  productSortOptions,
  productPage,
  setProductPage,
  productPageCount,
  pageSize,
  formatMoney,
  onOpenCreateDialog,
  onOpenEditDialog,
  onDeleteProduct,
}) {
  const hasProducts = myProducts.length > 0
  const safeProductPage = Math.min(Math.max(productPage, 1), productPageCount)
  const pageStart = filteredProductsCount === 0 ? 0 : (safeProductPage - 1) * pageSize + 1
  const pageEnd = Math.min(safeProductPage * pageSize, filteredProductsCount)

  return (
    <Stack spacing={1.6}>
      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        <Stack spacing={1.2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Stack spacing={0.3}>
              <Typography variant="h6" fontWeight={700}>등록 상품 목록</Typography>
              <Typography variant="body2" color="text.secondary">
                총 {filteredProductsCount}개 중 {pageStart}-{pageEnd}개 표시
              </Typography>
            </Stack>
            <Button variant="contained" onClick={onOpenCreateDialog} sx={{ width: { xs: '100%', md: 'auto' } }}>
              상품 등록
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} alignItems={{ xs: 'stretch', lg: 'center' }}>
            <Box sx={{ overflowX: 'auto', flex: 1 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={productCategoryFilter}
                onChange={(_, value) => {
                  if (value) {
                    setProductCategoryFilter(value)
                  }
                }}
                sx={{
                  minWidth: 'max-content',
                  '& .MuiToggleButton-root': {
                    px: 1.3,
                    fontWeight: 700,
                  },
                }}
              >
                {productCategoryFilterOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <TextField
              select
              size="small"
              label="정렬"
              value={productSortOrder}
              onChange={(event) => setProductSortOrder(event.target.value)}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              {productSortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        {!hasProducts ? (
          <Typography color="text.secondary">등록된 상품이 없습니다.</Typography>
        ) : visibleProducts.length === 0 ? (
          <Typography color="text.secondary">선택한 조건에 맞는 상품이 없습니다.</Typography>
        ) : (
          <Stack spacing={1.4}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>이미지</TableCell>
                    <TableCell>상품명</TableCell>
                    <TableCell>카테고리</TableCell>
                    <TableCell>사이즈</TableCell>
                    <TableCell align="right">가격</TableCell>
                    <TableCell align="right">재고</TableCell>
                    <TableCell align="right">관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        {product.imageUrl ? (
                          <Box
                            component="img"
                            src={resolveImageUrl(product.imageUrl)}
                            alt={product.name}
                            sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1 }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        {Array.isArray(product.options) && product.options.length > 0
                          ? product.options.map((option) => `${option.sizeLabel}:${option.quantity}`).join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell align="right">{formatMoney(product.price)}</TableCell>
                      <TableCell align="right">{product.quantity}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.6} justifyContent="flex-end">
                          <Button size="small" variant="outlined" onClick={() => onOpenEditDialog(product)}>수정</Button>
                          <Button size="small" color="error" variant="outlined" onClick={() => onDeleteProduct(product.id)}>삭제</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Stack alignItems="center">
              <Pagination
                count={productPageCount}
                page={safeProductPage}
                onChange={(_, value) => setProductPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  )
}

export default ProductsTabPanel
