import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import resolveImageUrl from '../../utils/resolveImageUrl'

function ProductsTabPanel({ myProducts, formatMoney, onOpenCreateDialog, onOpenEditDialog, onDeleteProduct }) {
  return (
    <Stack spacing={1.6}>
      <Paper sx={{ p: 2, borderRadius: 2.4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 1.2 }}>
          <Typography variant="h6" fontWeight={700}>등록 상품 목록</Typography>
          <Button variant="contained" onClick={onOpenCreateDialog} sx={{ width: { xs: '100%', md: 'auto' } }}>
            상품 등록
          </Button>
        </Stack>

        {myProducts.length === 0 ? (
          <Typography color="text.secondary">등록된 상품이 없습니다.</Typography>
        ) : (
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
                {myProducts.map((product) => (
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
        )}
      </Paper>
    </Stack>
  )
}

export default ProductsTabPanel
