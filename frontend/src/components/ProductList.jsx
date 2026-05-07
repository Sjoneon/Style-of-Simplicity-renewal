import { useState } from 'react'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import resolveImageUrl from '../utils/resolveImageUrl'

function ProductList({
  products,
  onToggleWishlist,
  isWishlistSelected,
  wishlistLoadingProductId,
}) {
  const [hoveredProductId, setHoveredProductId] = useState(null)

  if (!products.length) {
    return (
      <Typography variant="body1" color="text.secondary">
        조건에 맞는 상품이 없습니다.
      </Typography>
    )
  }

  return (
    <Grid container spacing={{ xs: 1.2, md: 1.5 }} columns={{ xs: 4, sm: 8, md: 12, lg: 10 }}>
      {products.map((product) => {
        const imageSrc = resolveImageUrl(product.imageUrl)
        const previewImageSrc = resolveImageUrl(product.descriptionImageUrl)
        // 소비자 리스트는 "상세 진입 전 비교"가 목적이라 hover 시 2번째 이미지로 디테일만 빠르게 보여준다.
        const hasPreviewImage = Boolean(previewImageSrc && previewImageSrc !== imageSrc)
        const isHovered = hoveredProductId === product.id

        const brandName = String(product.sellerName || 'SOS').trim()
        const salePrice = Number(product.price || 0)
        const originalPrice = Number(product.originalPrice || 0)
        const hasSale = Number.isFinite(originalPrice) && originalPrice > salePrice
        const discountRate = hasSale
          ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
          : 0

        const wished = typeof isWishlistSelected === 'function'
          ? Boolean(isWishlistSelected(product.id))
          : false

        return (
          <Grid key={product.id} size={{ xs: 4, sm: 4, md: 3, lg: 2 }}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 2.2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 5px 14px rgba(0,0,0,0.04)',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 9px 18px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={`/products/${product.id}`}
                sx={{ alignItems: 'stretch', display: 'block' }}
                onMouseEnter={() => setHoveredProductId(product.id)}
                onMouseLeave={() => setHoveredProductId(null)}
              >
                {imageSrc ? (
                  <Box
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      aspectRatio: '4 / 5',
                      bgcolor: '#f4f4f4',
                    }}
                  >
                    <Box
                      component="img"
                      src={imageSrc}
                      alt={product.name}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'opacity 180ms ease',
                        opacity: hasPreviewImage && isHovered ? 0 : 1,
                      }}
                    />

                    {hasPreviewImage && (
                      <Box
                        component="img"
                        src={previewImageSrc}
                        alt={`${product.name} 상세 미리보기`}
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'opacity 180ms ease',
                          opacity: isHovered ? 1 : 0,
                        }}
                      />
                    )}

                    <IconButton
                      size="small"
                      onClick={(event) => {
                        // 카드 전체 클릭(상세 이동)과 하트 클릭(찜 토글)을 분리하기 위해 이벤트 전파를 막는다.
                        event.preventDefault()
                        event.stopPropagation()
                        if (typeof onToggleWishlist === 'function') {
                          onToggleWishlist(product.id)
                        }
                      }}
                      disabled={wishlistLoadingProductId === product.id}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        bgcolor: 'rgba(255,255,255,0.88)',
                        color: wished ? 'error.main' : '#2b2b2b',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.96)',
                        },
                      }}
                    >
                      {wished ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                ) : (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      height: 220,
                      bgcolor: '#f4f4f4',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="body2">이미지 없음</Typography>
                  </Stack>
                )}

                <CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 } }}>
                  <Stack spacing={0.45}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#171717' }}>
                        {brandName}
                      </Typography>
                      {Number(product.soldCount || 0) > 0 && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`판매 ${Number(product.soldCount).toLocaleString('ko-KR')}`}
                          sx={{ height: 22 }}
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontSize: 15,
                        lineHeight: 1.35,
                        minHeight: 41,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {product.name}
                    </Typography>

                    <Stack direction="row" spacing={0.7} alignItems="baseline" flexWrap="wrap" useFlexGap>
                      {/* 정상가가 판매가보다 클 때만 세일 노출: 정상가=판매가는 일반가로 취급 */}
                      {hasSale && (
                        <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 800 }}>
                          {discountRate}%
                        </Typography>
                      )}
                      <Typography variant="h6" sx={{ fontSize: 22, fontWeight: 800, color: '#111111' }}>
                        {salePrice.toLocaleString('ko-KR')}원
                      </Typography>
                      {hasSale && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            textDecoration: 'line-through',
                          }}
                        >
                          {originalPrice.toLocaleString('ko-KR')}원
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ProductList
