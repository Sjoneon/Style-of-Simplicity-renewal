import { Box, CircularProgress, IconButton, Paper, Stack, Typography } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import resolveImageUrl from '../../utils/resolveImageUrl'

function HomeHeroBanner({ bannerLoading, currentBanner, banners, onPrev, onNext, onClick }) {
  return (
    <Paper
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#0f0f0f',
        minHeight: { xs: 220, md: 300 },
      }}
    >
      {bannerLoading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: { xs: 220, md: 300 }, color: '#ffffff' }}>
          <CircularProgress size={28} sx={{ color: '#ffffff' }} />
        </Stack>
      ) : currentBanner ? (
        <>
          <Box
            component="img"
            src={resolveImageUrl(currentBanner.imageUrl)}
            alt={currentBanner.title || '메인 광고 배너'}
            onClick={onClick}
            sx={{
              width: '100%',
              height: { xs: 220, md: 300 },
              objectFit: 'cover',
              display: 'block',
              cursor: currentBanner?.targetProductId ? 'pointer' : 'default',
              filter: 'grayscale(0.08)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.22) 52%, rgba(0,0,0,0.16) 100%)',
              pointerEvents: 'none',
            }}
          />
          <Stack spacing={0.8} sx={{ position: 'absolute', left: { xs: 20, md: 28 }, bottom: { xs: 18, md: 24 }, color: '#ffffff' }}>
            <Typography variant="overline" sx={{ letterSpacing: 1.1, opacity: 0.84 }}>
              CURATED PICK
            </Typography>
            {currentBanner.title && (
              <Typography variant="h5" sx={{ fontWeight: 800, maxWidth: 560 }}>
                {currentBanner.title}
              </Typography>
            )}
            {currentBanner.subtitle && (
              <Typography variant="body2" sx={{ opacity: 0.86 }}>
                {currentBanner.subtitle}
              </Typography>
            )}
          </Stack>

          {banners.length > 1 && (
            <>
              <IconButton
                onClick={onPrev}
                sx={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#ffffff',
                  bgcolor: 'rgba(0,0,0,0.36)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.52)' },
                }}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
              <IconButton
                onClick={onNext}
                sx={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#ffffff',
                  bgcolor: 'rgba(0,0,0,0.36)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.52)' },
                }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </>
          )}
        </>
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: { xs: 220, md: 300 }, color: '#ffffff' }}>
          <Typography variant="h6">현재 리뉴얼 중입니다. 잠시만 기다려주세요.</Typography>
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            더욱 좋은 제품으로 찾아 뵙겠습니다.
          </Typography>
        </Stack>
      )}
    </Paper>
  )
}

export default HomeHeroBanner
