export const ORDER_STATUS_LABELS = {
  ORDERED: '결제완료/배송대기',
  PROCESSED: '배송중(처리)',
  CANCELLED: '취소',
  RETURNED: '반품',
  EXCHANGED: '교환',
}

export const ORDER_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ORDERED', label: ORDER_STATUS_LABELS.ORDERED },
  { value: 'PROCESSED', label: ORDER_STATUS_LABELS.PROCESSED },
  { value: 'CANCELLED', label: ORDER_STATUS_LABELS.CANCELLED },
  { value: 'RETURNED', label: ORDER_STATUS_LABELS.RETURNED },
  { value: 'EXCHANGED', label: ORDER_STATUS_LABELS.EXCHANGED },
]

export const SECTION_SX = {
  p: { xs: 1.7, md: 2 },
  borderRadius: 2,
  border: '1px solid',
  borderColor: '#e8e8e8',
  boxShadow: 'none',
  bgcolor: '#ffffff',
}

export const ITEM_SX = {
  p: 1.1,
  borderRadius: 1.5,
  border: '1px solid',
  borderColor: '#ededed',
  bgcolor: '#fafafa',
}

export const EMPTY_PROFILE_FORM = {
  name: '',
  phone: '',
}

export const EMPTY_ADDRESS_FORM = {
  postcode: '',
  address: '',
  detailAddress: '',
}

export const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export const EMPTY_REVIEW_FORM = {
  orderId: '',
  rating: '5',
  content: '',
}
