import {
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined'
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined'
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined'

const navButtonSx = {
  borderRadius: 1.4,
  minHeight: 44,
  px: 1.2,
  '&.Mui-selected': {
    bgcolor: '#111111',
    color: '#ffffff',
    '&:hover': {
      bgcolor: '#222222',
    },
    '& .MuiListItemIcon-root': {
      color: '#ffffff',
    },
  },
}

const childButtonSx = {
  ...navButtonSx,
  minHeight: 36,
  pl: 1.1,
  pr: 1.2,
  color: '#333333',
  '& .MuiListItemIcon-root': {
    minWidth: 30,
    color: '#777777',
  },
  '&.Mui-selected': {
    bgcolor: '#f1f1f1',
    color: '#111111',
    '&:hover': {
      bgcolor: '#e9e9e9',
    },
    '& .MuiListItemIcon-root': {
      color: '#111111',
    },
  },
}

const childListSx = {
  ml: 2.3,
  mt: 0.5,
  mb: 0.2,
  pl: 1,
  borderLeft: '1px solid',
  borderColor: 'divider',
}

function TopLevelDivider() {
  return <Divider sx={{ my: 0.7 }} />
}

function SellerDashboardSideNav({
  activeTab,
  activeHomeView,
  inquiryAnswerFilter,
  onSelectTab,
  onSelectHomeView,
  onSelectInquiryAnswerFilter,
}) {
  const homeOpen = activeTab === 'home'
  const inquiryOpen = activeTab === 'inquiries'

  const selectHome = (view) => {
    onSelectTab('home')
    onSelectHomeView(view)
  }

  const selectInquiry = (filter) => {
    onSelectTab('inquiries')
    onSelectInquiryAnswerFilter(filter)
  }

  return (
    <Paper
      component="nav"
      sx={{
        p: 1,
        borderRadius: 2.4,
        border: '1px solid',
        borderColor: 'divider',
        position: { md: 'sticky' },
        top: { md: 96 },
      }}
    >
      <List dense disablePadding>
        <ListItemButton selected={activeTab === 'overview'} onClick={() => onSelectTab('overview')} sx={navButtonSx}>
          <ListItemIcon><AssessmentOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="운영 요약" primaryTypographyProps={{ fontWeight: 800 }} />
        </ListItemButton>

        <TopLevelDivider />

        <ListItemButton selected={homeOpen} onClick={() => selectHome(activeHomeView || 'banner')} sx={navButtonSx}>
          <ListItemIcon><HomeOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="홈 관리" primaryTypographyProps={{ fontWeight: 800 }} />
          {homeOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
        <Collapse in={homeOpen} timeout="auto" unmountOnExit>
          <List dense disablePadding sx={childListSx}>
            <ListItemButton selected={activeHomeView === 'banner'} onClick={() => selectHome('banner')} sx={childButtonSx}>
              <ListItemIcon><ViewCarouselOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="메인 배너 관리" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
            <ListItemButton selected={activeHomeView === 'discovery'} onClick={() => selectHome('discovery')} sx={childButtonSx}>
              <ListItemIcon><TravelExploreOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="홈 탐색 관리" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </List>
        </Collapse>

        <TopLevelDivider />

        <ListItemButton selected={activeTab === 'products'} onClick={() => onSelectTab('products')} sx={navButtonSx}>
          <ListItemIcon><Inventory2OutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="상품 관리" primaryTypographyProps={{ fontWeight: 800 }} />
        </ListItemButton>

        <TopLevelDivider />

        <ListItemButton selected={activeTab === 'orders'} onClick={() => onSelectTab('orders')} sx={navButtonSx}>
          <ListItemIcon><LocalShippingOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="주문·배송" primaryTypographyProps={{ fontWeight: 800 }} />
        </ListItemButton>

        <TopLevelDivider />

        <ListItemButton selected={inquiryOpen} onClick={() => selectInquiry(inquiryAnswerFilter || 'pending')} sx={navButtonSx}>
          <ListItemIcon><QuestionAnswerOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Q&A" primaryTypographyProps={{ fontWeight: 800 }} />
          {inquiryOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
        <Collapse in={inquiryOpen} timeout="auto" unmountOnExit>
          <List dense disablePadding sx={childListSx}>
            <ListItemButton selected={inquiryAnswerFilter === 'answered'} onClick={() => selectInquiry('answered')} sx={childButtonSx}>
              <ListItemText primary="답변 된 문의" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
            <ListItemButton selected={inquiryAnswerFilter === 'pending'} onClick={() => selectInquiry('pending')} sx={childButtonSx}>
              <ListItemText primary="미답변된 문의" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          </List>
        </Collapse>

        <TopLevelDivider />

        <ListItemButton selected={activeTab === 'sales'} onClick={() => onSelectTab('sales')} sx={navButtonSx}>
          <ListItemIcon><PaymentsOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="매출" primaryTypographyProps={{ fontWeight: 800 }} />
        </ListItemButton>
      </List>
    </Paper>
  )
}

export default SellerDashboardSideNav
