import { Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { SORT_OPTIONS } from '../../pages/home/homeConfig'

function HomeSearchSummaryBar({ query, onlyInStock, sortOption, onChangeSortOption, visibleCount }) {
  return (
    <Paper sx={{ p: 1.4, borderRadius: 2.6, border: '1px solid', borderColor: 'divider' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
          {query && <Chip size="small" variant="outlined" label={`검색: ${query}`} />}
          {onlyInStock && <Chip size="small" variant="outlined" label="재고 있음" />}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <TextField
            select
            size="small"
            label="정렬"
            value={sortOption}
            onChange={(event) => onChangeSortOption(event.target.value)}
            sx={{ minWidth: 140 }}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" fontWeight={700}>{visibleCount}개</Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default HomeSearchSummaryBar
