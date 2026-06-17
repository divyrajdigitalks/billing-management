'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Drawer,
  Chip,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchParties, createParty, updateParty, deleteParty } from '../../redux/partySlice';
import { fetchPartyHistory, clearHistory } from '../../redux/historySlice';
import { ThemeTable } from '../../components/ThemeTable';
import { ThemeDialog } from '../../components/ThemeDialog';
import { ThemeInput } from '../../components/ThemeInput';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Loader } from '../../components/Loader';
import { showToast } from '../../components/LayoutShell';
import { PartyData } from '../../services/partyService';

const validationSchema = Yup.object().shape({
  partyName: Yup.string().required('Party name is required'),
  mobileNo: Yup.string()
    .required('Mobile number is required')
    .matches(/^\+91[6-9]\d{9}$/, 'Mobile number must be 10 digits starting with 6-9, prefixed with +91'),
  address: Yup.string(),
  remark: Yup.string(),
});

export default function PartyMaster() {
  const dispatch = useDispatch<AppDispatch>();
  const { parties, total, page, loading, error } = useSelector((state: RootState) => state.party);
  const { historyData, loading: historyLoading } = useSelector((state: RootState) => state.history);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog/Drawer states
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [selectedParty, setSelectedParty] = useState<PartyData | null>(null);
  const [vehicleInput, setVehicleInput] = useState('');
  const [vehiclesList, setVehiclesList] = useState<string[]>([]);

  useEffect(() => {
    loadParties();
  }, [currentPage, rowsPerPage, search]);

  const loadParties = () => {
    dispatch(fetchParties({
      search,
      page: currentPage + 1,
      limit: rowsPerPage,
      sortBy: 'partyName',
      order: 'asc'
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
    setCurrentPage(0);
  };

  const handleAddVehicle = () => {
    if (vehicleInput.trim()) {
      const v = vehicleInput.trim().toUpperCase();
      if (!vehiclesList.includes(v)) {
        setVehiclesList([...vehiclesList, v]);
      }
      setVehicleInput('');
    }
  };

  const handleRemoveVehicle = (indexToRemove: number) => {
    setVehiclesList(vehiclesList.filter((_, idx) => idx !== indexToRemove));
  };

  const formik = useFormik({
    initialValues: {
      partyName: '',
      mobileNo: '',
      address: '',
      remark: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const partyPayload = {
          ...values,
          vehicleNumbers: vehiclesList,
        };

        if (selectedParty && selectedParty._id) {
          await dispatch(updateParty({ id: selectedParty._id, data: partyPayload })).unwrap();
          showToast('Party updated successfully', 'success');
        } else {
          await dispatch(createParty(partyPayload)).unwrap();
          showToast('Party added successfully', 'success');
        }
        setFormOpen(false);
        loadParties();
      } catch (err: any) {
        showToast(err || 'Operation failed', 'error');
      }
    },
  });

  const handleOpenAddForm = () => {
    setSelectedParty(null);
    setVehiclesList([]);
    setVehicleInput('');
    formik.resetForm();
    setFormOpen(true);
  };

  const handleOpenEditForm = (party: PartyData) => {
    setSelectedParty(party);
    setVehiclesList(party.vehicleNumbers || []);
    setVehicleInput('');
    formik.setValues({
      partyName: party.partyName,
      mobileNo: party.mobileNo,
      address: party.address || '',
      remark: party.remark || '',
    });
    setFormOpen(true);
  };

  const handleOpenDeleteDialog = (party: PartyData) => {
    setSelectedParty(party);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedParty && selectedParty._id) {
      try {
        await dispatch(deleteParty(selectedParty._id)).unwrap();
        showToast('Party deleted successfully', 'success');
        setDeleteDialogOpen(false);
        loadParties();
      } catch (err: any) {
        showToast(err || 'Failed to delete party', 'error');
      }
    }
  };

  const handleOpenHistory = (party: PartyData) => {
    if (party._id) {
      setSelectedParty(party);
      dispatch(fetchPartyHistory(party._id));
      setHistoryOpen(true);
    }
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    dispatch(clearHistory());
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const columns = [
    { id: 'partyName', label: 'Party Name', minWidth: 150 },
    { id: 'mobileNo', label: 'Mobile Number', minWidth: 120 },
    { id: 'address', label: 'Address', minWidth: 180 },
    {
      id: 'vehicleNumbers',
      label: 'Vehicle Numbers',
      minWidth: 200,
      format: (vehicles: string[]) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {vehicles && vehicles.map((v, idx) => (
            <Chip key={idx} label={v} size="small" variant="outlined" color="primary" />
          ))}
        </Box>
      ),
    },
    {
      id: 'totalDueAmount',
      label: 'Pending Amount',
      minWidth: 180,
      align: 'center' as const,
      format: (val: number) => {
        const hasPending = (val || 0) > 0;
        return (
          <span style={{ color: hasPending ? '#d93025' : '#188038', fontWeight: hasPending ? 700 : 500 }}>
            {formatCurrency(val || 0)}
          </span>
        );
      },
    },
    { id: 'remark', label: 'Remark', minWidth: 120 },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 160,
      align: 'right' as const,
      format: (_: any, row: PartyData) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <IconButton color="info" onClick={() => handleOpenHistory(row)} title="View History">
            <HistoryIcon />
          </IconButton>
          <IconButton color="primary" onClick={() => handleOpenEditForm(row)} title="Edit">
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleOpenDeleteDialog(row)} title="Delete">
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Loader open={historyLoading} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Party Master
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your customer database and track transaction history
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddForm}>
          Add Party
        </Button>
      </Box>

      {/* Filter and Search */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search by name, mobile or address..."
            value={search}
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: 320 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#5f6368' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
        </Box>
      </Paper>

      {/* Parties Table */}
      <ThemeTable
        columns={columns}
        rows={parties}
        totalCount={total}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setCurrentPage(0);
        }}
        loading={loading}
      />

      {/* Add/Edit Dialog */}
      <ThemeDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selectedParty ? 'Edit Party' : 'Add Party'}
        actions={
          <DialogActions>
            <Button onClick={() => setFormOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => formik.handleSubmit()} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <Box>
            <ThemeInput name="partyName" label="Party Name *" formik={formik} />
          </Box>
          <Box>
            <ThemeInput name="mobileNo" label="Mobile Number *" formik={formik} />
          </Box>
          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="address" label="Address" multiline rows={2} formik={formik} />
          </Box>
          
          {/* Vehicles Management */}
          <Box sx={{ gridColumn: 'span 2' }}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 600 }}>
              Vehicle Numbers
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                size="small"
                label="Add Vehicle Number (e.g. GJ01AB1234)"
                value={vehicleInput}
                onChange={(e) => setVehicleInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVehicle())}
                sx={{ flexGrow: 1 }}
              />
              <Button variant="outlined" onClick={handleAddVehicle} startIcon={<AddIcon />}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {vehiclesList.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  No vehicle numbers added.
                </Typography>
              ) : (
                vehiclesList.map((veh, idx) => (
                  <Chip
                    key={idx}
                    label={veh}
                    onDelete={() => handleRemoveVehicle(idx)}
                    color="primary"
                    variant="outlined"
                  />
                ))
              )}
            </Box>
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="remark" label="Remark" multiline rows={2} formik={formik} />
          </Box>
        </Box>
      </ThemeDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Party"
        message={`Are you sure you want to delete "${selectedParty?.partyName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* History Drawer */}
      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={handleCloseHistory}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 550, md: 650 }, p: 3 }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Transaction History
          </Typography>
          <IconButton onClick={handleCloseHistory}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {historyData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflowY: 'auto' }}>
            {/* Party Summary Info */}
            <Paper sx={{ p: 2.5, bgcolor: '#f8f9fa', border: '1px solid #dadce0', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                {historyData.partyInfo.partyName}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5 }}>
                <Box sx={{ gridColumn: 'span 3' }}>
                  <Typography variant="caption" color="textSecondary">Mobile:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{historyData.partyInfo.mobileNo}</Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 3' }}>
                  <Typography variant="caption" color="textSecondary">Address:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{historyData.partyInfo.address || '-'}</Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 2', mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">Total Billed:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#137333' }}>
                    {formatCurrency(historyData.totalBillAmount)}
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 2', mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">Total Received:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#188038' }}>
                    {formatCurrency(historyData.totalReceivedAmount)}
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 2', mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">Pending Amount:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#d93025' }}>
                    {formatCurrency(historyData.totalPendingAmount)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Timeline of transactions */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Transaction Timeline
            </Typography>
            
            {historyData.transactions.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography color="textSecondary">No transactions recorded yet.</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {historyData.transactions.map((tx, idx) => {
                  const isBill = tx.type === 'Bill Created';
                  return (
                    <Paper
                      key={tx._id || idx}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderLeft: `5px solid ${isBill ? '#1a73e8' : '#188038'}`,
                        borderRadius: '0 8px 8px 0',
                      }}
                      elevation={1}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isBill ? '#1a73e8' : '#188038' }}>
                          {tx.type} {tx.billNo !== '-' && `(${tx.billNo})`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(tx.date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                        {isBill ? (
                          <Box>
                            <Typography variant="caption" color="textSecondary">Bill Amount</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(tx.billAmount)}</Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="caption" color="textSecondary">Received Amount</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(tx.receivedAmount)}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" color="textSecondary">Running Balance</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#d93025' }}>
                            {formatCurrency(tx.runningBalance)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Pending Status</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(tx.pendingAmount)}</Typography>
                        </Box>
                      </Box>
                      {tx.remark && (
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, bgcolor: '#f1f3f4', p: 0.8, borderRadius: 1 }}>
                          <strong>Remark:</strong> {tx.remark}
                        </Typography>
                      )}
                    </Paper>
                  );
                })}
              </List>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
