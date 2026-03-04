import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import resolveImageUrl from '../utils/resolveImageUrl'

function ProductList({ products, onAddToCart, addingProductId }) {
  if (!products.length) {
    return (
      <Typography variant="body1" color="text.secondary">
        조건에 맞는 상품이 없습니다.
      </Typography>
    )
  }

  return (
    <Grid container spacing={2.2}>
      {products.map((product) => {
        const imageSrc = resolveImageUrl(product.imageUrl)
        const hasStock = Number(product.quantity) > 0
        const isNew = Number(product.id) >= 20
        const hasOptions = Array.isArray(product.options) && product.options.length > 0

        return (
          <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 26px rgba(0,0,0,0.09)',
                },
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={`/products/${product.id}`}
                sx={{ alignItems: 'stretch', display: 'block' }}
              >
                {imageSrc ? (
                  <CardMedia component="img" height="190" image={imageSrc} alt={product.name} />
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      height: 190,
                      bgcolor: '#f4f4f4',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">이미지 없음</Typography>
                  </Stack>
                )}
              </CardActionArea>

              <CardContent>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: 18,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: 48,
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Stack spacing={0.6}>
                      {!hasStock && (
                        <Chip
                          size="small"
                          color="error"
                          variant="filled"
                          label="SOLD OUT"
                        />
                      )}
                      {isNew && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="NEW"
                          sx={{ borderColor: '#111111', color: '#111111' }}
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {product.category || '미분류'}
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: 19, color: '#111111' }}>
                    {Number(product.price).toLocaleString('ko-KR')}원
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    남은 수량: {product.quantity}
                  </Typography>

                  <Divider />

                  <Stack direction="row" spacing={1}>
                    <Button component={RouterLink} to={`/products/${product.id}`} variant="outlined" fullWidth>
                      상세 보기
                    </Button>
                    {hasOptions ? (
                      <Button component={RouterLink} to={`/products/${product.id}`} variant="contained" fullWidth>
                        사이즈 선택
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!hasStock || addingProductId === product.id}
                        onClick={() => onAddToCart(product.id)}
                      >
                        바로 담기
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ProductList
