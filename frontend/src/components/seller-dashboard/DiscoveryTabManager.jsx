import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

function DiscoveryTabManager({
  managedDiscoveryTabs,
  discoveryTabDrafts,
  setDiscoveryTabDrafts,
  newDiscoveryTabForm,
  setNewDiscoveryTabForm,
  creatingDiscoveryTab,
  updatingDiscoveryTabId,
  deletingDiscoveryTabId,
  onCreate,
  onSave,
  onDelete,
}) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2.4 }}>
      <Stack spacing={1.2}>
        <Typography variant="h6" fontWeight={700}>홈 탐색 탭 관리</Typography>
        <Typography variant="body2" color="text.secondary">
          홈 상단 탭을 추가/수정/삭제할 수 있습니다. 비활성 탭은 홈에서 숨겨집니다.
        </Typography>

        <Stack
          component="form"
          onSubmit={onCreate}
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            label="새 탭 이름"
            value={newDiscoveryTabForm.label}
            onChange={(event) => setNewDiscoveryTabForm((prev) => ({ ...prev, label: event.target.value }))}
            required
            sx={{ minWidth: { md: 220 } }}
          />
          <TextField
            label="노출 순서(선택)"
            type="number"
            inputProps={{ min: 0 }}
            value={newDiscoveryTabForm.displayOrder}
            onChange={(event) => setNewDiscoveryTabForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
            sx={{ minWidth: { md: 180 } }}
          />
          <FormControlLabel
            control={(
              <Switch
                checked={newDiscoveryTabForm.active !== false}
                onChange={(event) => setNewDiscoveryTabForm((prev) => ({ ...prev, active: event.target.checked }))}
              />
            )}
            label="활성"
          />
          <Button type="submit" variant="contained" disabled={creatingDiscoveryTab} sx={{ width: { xs: '100%', md: 'auto' } }}>
            탭 추가
          </Button>
        </Stack>

        {managedDiscoveryTabs.length === 0 ? (
          <Typography color="text.secondary">탭 정보를 불러오지 못했습니다.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>탭 이름</TableCell>
                  <TableCell align="right">순서</TableCell>
                  <TableCell align="center">활성</TableCell>
                  <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {managedDiscoveryTabs.map((tab) => {
                  const draft = discoveryTabDrafts[tab.id] || {
                    label: tab.label,
                    displayOrder: String(tab.displayOrder ?? 0),
                    active: tab.active !== false,
                  }
                  const canManage = tab.id != null

                  return (
                    <TableRow key={`discovery-tab-${tab.id ?? tab.tabKey}`}>
                      <TableCell sx={{ minWidth: 180 }}>
                        <TextField
                          size="small"
                          value={draft.label}
                          disabled={!canManage}
                          onChange={(event) =>
                            setDiscoveryTabDrafts((prev) => ({
                              ...prev,
                              [tab.id]: {
                                ...draft,
                                label: event.target.value,
                              },
                            }))
                          }
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 140 }}>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0 }}
                          value={draft.displayOrder}
                          disabled={!canManage}
                          onChange={(event) =>
                            setDiscoveryTabDrafts((prev) => ({
                              ...prev,
                              [tab.id]: {
                                ...draft,
                                displayOrder: event.target.value,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={draft.active !== false}
                          disabled={!canManage}
                          onChange={(event) =>
                            setDiscoveryTabDrafts((prev) => ({
                              ...prev,
                              [tab.id]: {
                                ...draft,
                                active: event.target.checked,
                              },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Stack direction="row" spacing={0.7} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={!canManage || updatingDiscoveryTabId === tab.id}
                            onClick={() => onSave(tab.id)}
                          >
                            저장
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={!canManage || deletingDiscoveryTabId === tab.id}
                            onClick={() => onDelete(tab.id)}
                          >
                            삭제
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>
    </Paper>
  )
}

export default DiscoveryTabManager
