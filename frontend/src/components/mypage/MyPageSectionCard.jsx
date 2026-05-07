import { Button, Paper, Stack, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { SECTION_SX } from '../../pages/mypage/myPageConfig'

function MyPageSectionCard({ sectionKey, title, summaryText, expandedSection, onToggle, children }) {
  const opened = expandedSection === sectionKey

  return (
    <Paper sx={SECTION_SX}>
      <Stack spacing={1.1}>
        <Button
          variant="text"
          color="inherit"
          onClick={() => onToggle(sectionKey)}
          sx={{ p: 0, justifyContent: 'space-between', textTransform: 'none' }}
        >
          <Typography fontWeight={800}>{title}</Typography>
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Typography variant="body2" color="text.secondary">{summaryText}</Typography>
            <ExpandMoreIcon
              fontSize="small"
              sx={{ transform: opened ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
            />
          </Stack>
        </Button>

        {opened && children}
      </Stack>
    </Paper>
  )
}

export default MyPageSectionCard
