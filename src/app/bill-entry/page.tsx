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
  List,
  ListItem,
  ListItemText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Card,
  CardContent,
  Divider,
  Autocomplete,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchBills, createBill, updateBill, deleteBill } from '../../redux/billSlice';
import { fetchParties, createParty } from '../../redux/partySlice';
import { fetchPartyHistory, clearHistory } from '../../redux/historySlice';
import { createPayment } from '../../redux/paymentSlice';
import { ThemeTable } from '../../components/ThemeTable';
import { ThemeDialog } from '../../components/ThemeDialog';
import { ThemeInput } from '../../components/ThemeInput';
import { ThemeDatePicker } from '../../components/ThemeDatePicker';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Loader } from '../../components/Loader';
import { showToast } from '../../components/LayoutShell';
import { BillData } from '../../services/billService';
import { PartyData } from '../../services/partyService';

const validationSchema = Yup.object().shape({
  partyId: Yup.string().required('Party selection is required'),
  vehicleNumber: Yup.string().required('Vehicle number selection is required'),
  billDate: Yup.date().required('Bill date is required'),
  billAmount: Yup.number()
    .required('Bill amount is required')
    .min(0, 'Bill amount must be positive'),
  receiveAmount: Yup.number()
    .min(0, 'Receive amount cannot be negative')
    .test('max-pending', 'Receive amount cannot exceed bill amount', function(value) {
      return Number(value || 0) <= Number(this.parent.billAmount || 0);
    }),
  remark: Yup.string(),
});

export default function BillEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const { bills, total, page, loading, error } = useSelector((state: RootState) => state.bill);
  const { parties } = useSelector((state: RootState) => state.party);
  const { historyData, loading: historyLoading } = useSelector((state: RootState) => state.history);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Quick add party vehicle state
  const [quickVehicleInput, setQuickVehicleInput] = useState('');
  const [quickVehiclesList, setQuickVehiclesList] = useState<string[]>([]);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAddPartyOpen, setQuickAddPartyOpen] = useState(false);

  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [selectedParty, setSelectedParty] = useState<PartyData | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<string[]>([]);
  const [partyMobile, setPartyMobile] = useState('');
  const [paymentInDialogOpen, setPaymentInDialogOpen] = useState(false);

  useEffect(() => {
    // Load all parties for dropdown once on mount
    dispatch(fetchParties({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    loadBills();
  }, [currentPage, rowsPerPage, search, dispatch]);

  const loadBills = () => {
    dispatch(fetchBills({
      search,
      page: currentPage + 1,
      limit: rowsPerPage,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
    setCurrentPage(0);
  };

  // Calculate pending amount
  const calculatePendingAmount = (billAmount: number, receiveAmount: number) => {
    return Math.max(0, (billAmount || 0) - (receiveAmount || 0));
  };

  const formik = useFormik({
    initialValues: {
      partyId: '',
      vehicleNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      billAmount: 0,
      receiveAmount: 0,
      remark: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedBill && selectedBill._id) {
          // Update bill (backend does not allow changing partyId or billNo, but can change amount, date, vehicle, remark)
          await dispatch(updateBill({ id: selectedBill._id, data: values })).unwrap();
          showToast('Bill updated successfully', 'success');
        } else {
          // Create bill
          await dispatch(createBill(values)).unwrap();
          showToast('Bill created successfully', 'success');
        }
        setFormOpen(false);
        loadBills();
      } catch (err: any) {
        showToast(err || 'Operation failed', 'error');
      }
    },
  });

  const quickPartyFormik = useFormik({
    initialValues: {
      partyName: '',
      mobileNo: '',
      address: '',
      remark: '',
    },
    validationSchema: Yup.object({
      partyName: Yup.string().required('Party name is required'),
      mobileNo: Yup.string()
        .required('Mobile number is required')
        .matches(/^\+91[6-9]\d{9}$/, 'Mobile number must be 10 digits starting with 6-9, prefixed with +91'),
      address: Yup.string(),
      remark: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        const newParty = await dispatch(createParty({ ...values, vehicleNumbers: quickVehiclesList })).unwrap();
        showToast('Party created successfully!', 'success');
        await dispatch(fetchParties({ limit: 1000 }));
        // Select newly created party
        handlePartyChange(newParty._id || '');
        // Reset quick add party state
        setQuickVehicleInput('');
        setQuickVehiclesList([]);
        setQuickAddPartyOpen(false);
        quickPartyFormik.resetForm();
      } catch (err: any) {
        showToast(err || 'Failed to create party', 'error');
      }
    }
  });

  // Handle party change to auto fill mobile and auto load vehicle numbers
  const handlePartyChange = (partyId: string) => {
    formik.setFieldValue('partyId', partyId);
    formik.setFieldValue('vehicleNumber', ''); // Reset vehicle selection
    
    const selectedPartyObj = parties.find(p => p._id === partyId);
    if (selectedPartyObj) {
      setPartyMobile(selectedPartyObj.mobileNo);
      setAvailableVehicles(selectedPartyObj.vehicleNumbers || []);
    } else {
      setPartyMobile('');
      setAvailableVehicles([]);
    }
  };

  const handleOpenHistory = (partyId: string, partyObj: PartyData) => {
    setSelectedParty(partyObj);
    dispatch(fetchPartyHistory(partyId));
    setHistoryOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    dispatch(clearHistory());
  };

  // Quick add party vehicle handlers
  const handleAddQuickVehicle = () => {
    if (quickVehicleInput.trim() && !quickVehiclesList.includes(quickVehicleInput.trim())) {
      setQuickVehiclesList([...quickVehiclesList, quickVehicleInput.trim()]);
      setQuickVehicleInput('');
    }
  };

  const handleRemoveQuickVehicle = (index: number) => {
    setQuickVehiclesList(quickVehiclesList.filter((_, i) => i !== index));
  };

  const handleOpenAddForm = () => {
    setSelectedBill(null);
    setAvailableVehicles([]);
    setPartyMobile('');
    formik.resetForm();
    formik.setFieldValue('billDate', new Date().toISOString().split('T')[0]);
    setFormOpen(true);
  };

  const handleOpenEditForm = (bill: BillData) => {
    setSelectedBill(bill);
    const pId = typeof bill.partyId === 'object' ? bill.partyId._id : bill.partyId;
    const matchedParty = parties.find(p => p._id === pId);

    if (matchedParty) {
      setPartyMobile(matchedParty.mobileNo);
      setAvailableVehicles(matchedParty.vehicleNumbers || []);
    }

    formik.setValues({
      partyId: pId || '',
      vehicleNumber: bill.vehicleNumber || '',
      billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : '',
      billAmount: bill.billAmount || 0,
      receiveAmount: 0,
      remark: bill.remark || '',
    });
    setFormOpen(true);
  };

  const handleOpenView = (bill: BillData) => {
    setSelectedBill(bill);
    setViewOpen(true);
  };

  const handleOpenDeleteDialog = (bill: BillData) => {
    setSelectedBill(bill);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedBill && selectedBill._id) {
      try {
        await dispatch(deleteBill(selectedBill._id)).unwrap();
        showToast('Bill deleted successfully', 'success');
        setDeleteDialogOpen(false);
        loadBills();
      } catch (err: any) {
        showToast(err || 'Failed to delete bill', 'error');
      }
    }
  };

  const handleOpenPaymentInDialog = (bill: BillData) => {
    setSelectedBill(bill);
    const pId = typeof bill.partyId === 'object' ? bill.partyId._id : bill.partyId;
    paymentFormik.resetForm();
    paymentFormik.setFieldValue('partyId', pId || '');
    paymentFormik.setFieldValue('amount', bill.pendingAmount || 0);
    paymentFormik.setFieldValue('paymentDate', new Date().toISOString().split('T')[0]);
    paymentFormik.setFieldValue('paymentMode', 'Cash');
    paymentFormik.setFieldValue('remark', `Payment for Bill ${bill.billNo}`);
    setPaymentInDialogOpen(true);
  };

  const paymentFormik = useFormik({
    initialValues: {
      partyId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMode: 'Cash' as 'Cash' | 'Bank' | 'UPI',
      remark: '',
    },
    validationSchema: Yup.object().shape({
      partyId: Yup.string().required('Party selection is required'),
      paymentDate: Yup.date().required('Payment date is required'),
      amount: Yup.number()
        .required('Received amount is required')
        .min(0.01, 'Amount must be greater than zero'),
      paymentMode: Yup.string()
        .required('Payment mode is required')
        .oneOf(['Cash', 'Bank', 'UPI'], 'Invalid Payment Mode'),
      remark: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        if (selectedBill && values.amount > (selectedBill.pendingAmount || 0)) {
          showToast(`Payment amount cannot exceed the pending amount of Rs. ${selectedBill.pendingAmount}`, 'error');
          return;
        }

        await dispatch(createPayment(values)).unwrap();
        showToast('Payment recorded successfully', 'success');
        setPaymentInDialogOpen(false);
        loadBills();
      } catch (err: any) {
        showToast(err || 'Failed to record payment', 'error');
      }
    }
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const columns = [
    { id: 'billNo', label: 'Bill No', minWidth: 100 },
    {
      id: 'partyName',
      label: 'Party Name',
      minWidth: 150,
      format: (_: any, row: BillData) => {
        const party = row.partyId as PartyData;
        return party ? party.partyName : '-';
      }
    },
    {
      id: 'mobileNo',
      label: 'Mobile No',
      minWidth: 120,
      format: (_: any, row: BillData) => {
        const party = row.partyId as PartyData;
        return party ? party.mobileNo : '-';
      }
    },
    { id: 'vehicleNumber', label: 'Vehicle No', minWidth: 120 },
    {
      id: 'billDate',
      label: 'Bill Date',
      minWidth: 100,
      format: (val: string) => formatDate(val)
    },
    {
      id: 'billAmount',
      label: 'Bill Amount',
      minWidth: 120,
      align: 'right' as const,
      format: (val: number) => formatCurrency(val)
    },
    {
      id: 'pendingAmount',
      label: 'Pending Amount',
      minWidth: 120,
      align: 'right' as const,
      format: (val: number) => formatCurrency(val)
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 180,
      align: 'right' as const,
      format: (_: any, row: BillData) => {
        const party = row.partyId as PartyData;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {party && (
              <IconButton color="info" onClick={() => handleOpenHistory(party._id || '', party)} title="View History">
                <HistoryIcon />
              </IconButton>
            )}
            {(row.pendingAmount || 0) > 0 && (
              <IconButton color="success" onClick={() => handleOpenPaymentInDialog(row)} title="Payment In">
                <AccountBalanceWalletIcon />
              </IconButton>
            )}
            <IconButton color="default" onClick={() => handleOpenView(row)} title="View Detail">
              <VisibilityIcon />
            </IconButton>
            <IconButton color="primary" onClick={() => handleOpenEditForm(row)} title="Edit">
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => handleOpenDeleteDialog(row)} title="Delete">
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Bill Entry
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your billing invoices, track collections, and view pending status
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddForm}>
          New Bill
        </Button>
      </Box>

      {/* Filter and Search */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search by Bill No, Vehicle No, or Remark..."
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

      {/* Bills Table */}
      <ThemeTable
        columns={columns}
        rows={bills}
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
        title={selectedBill ? `Edit Bill (${selectedBill.billNo})` : 'New Bill'}
        actions={
          <DialogActions>
            <Button onClick={() => setFormOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => formik.handleSubmit()} variant="contained" color="primary">
              Save Bill
            </Button>
          </DialogActions>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          {/* Party Selection Dropdown with quick add */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
            <Autocomplete
              fullWidth
              size="small"
              options={parties}
              getOptionLabel={(option) => option.partyName || ''}
              value={parties.find((p) => p._id === formik.values.partyId) || null}
              onChange={(_event, newValue) => {
                handlePartyChange(newValue ? newValue._id || '' : '');
              }}
              disabled={Boolean(selectedBill)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Party *"
                  error={formik.touched.partyId && Boolean(formik.errors.partyId)}
                  helperText={formik.touched.partyId && formik.errors.partyId}
                  onBlur={formik.handleBlur}
                  name="partyId"
                />
              )}
            />
            {!selectedBill && (
              <Button
                variant="outlined"
                onClick={() => setQuickAddPartyOpen(true)}
                sx={{ minWidth: 100, height: 40 }}
              >
                + Add
              </Button>
            )}
          </Box>

          {/* Auto fill mobile number */}
          <Box>
            <TextField
              fullWidth
              size="small"
              label="Mobile Number (Auto-fill)"
              value={partyMobile}
              disabled
              variant="filled"
            />
          </Box>

          {/* Vehicle Number Dropdown */}
          <Box>
            <FormControl fullWidth size="small" error={formik.touched.vehicleNumber && Boolean(formik.errors.vehicleNumber)}>
              <InputLabel id="vehicleNumber-label">Select Vehicle *</InputLabel>
              <Select
                labelId="vehicleNumber-label"
                id="vehicleNumber"
                name="vehicleNumber"
                value={formik.values.vehicleNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Select Vehicle *"
                disabled={availableVehicles.length === 0}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {availableVehicles.map((veh, idx) => (
                  <MenuItem key={idx} value={veh}>
                    {veh}
                  </MenuItem>
                ))}
              </Select>
              {availableVehicles.length === 0 && (
                <FormHelperText>No vehicles available. Please add vehicle to party first.</FormHelperText>
              )}
              {formik.touched.vehicleNumber && formik.errors.vehicleNumber && (
                <FormHelperText>{formik.errors.vehicleNumber}</FormHelperText>
              )}
            </FormControl>
          </Box>

          <Box>
            <ThemeDatePicker name="billDate" label="Bill Date *" formik={formik} />
          </Box>

          <Box>
            <ThemeInput name="billAmount" label="Bill Amount *" type="number" formik={formik} />
          </Box>

          <Box>
            <ThemeInput name="receiveAmount" label="Receive Amount" type="number" formik={formik} />
          </Box>

          <Box>
            <TextField
              fullWidth
              size="small"
              label="Pending Amount"
              value={calculatePendingAmount(formik.values.billAmount, formik.values.receiveAmount)}
              disabled
              variant="filled"
            />
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="remark" label="Remark" multiline rows={2} formik={formik} />
          </Box>
        </Box>
      </ThemeDialog>

      {/* View Detail Dialog */}
      <ThemeDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Bill Invoice - ${selectedBill?.billNo}`}
      >
        {selectedBill && (
          <Card variant="outlined" sx={{ p: 1, boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Party Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(selectedBill.partyId as PartyData)?.partyName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Mobile Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {(selectedBill.partyId as PartyData)?.mobileNo}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Vehicle Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedBill.vehicleNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Bill Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(selectedBill.billDate)}
                  </Typography>
                </Box>
                
                <Box sx={{ gridColumn: 'span 2' }}><Divider sx={{ my: 1 }} /></Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, gridColumn: 'span 2' }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#137333' }}>
                      {formatCurrency(selectedBill.billAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Paid Amount</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#188038' }}>
                      {formatCurrency(selectedBill.paidAmount || 0)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Pending Amount</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#d93025' }}>
                      {formatCurrency(selectedBill.pendingAmount || 0)}
                    </Typography>
                  </Box>
                </Box>

                {selectedBill.remark && (
                  <>
                    <Box sx={{ gridColumn: 'span 2' }}><Divider sx={{ my: 1 }} /></Box>
                    <Box sx={{ gridColumn: 'span 2' }}>
                      <Typography variant="caption" color="textSecondary">Remark</Typography>
                      <Typography variant="body2" sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1 }}>
                        {selectedBill.remark}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </ThemeDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Bill Invoice"
        message={`Are you sure you want to delete ${selectedBill?.billNo}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Quick Add Party Dialog */}
      <ThemeDialog
        open={quickAddPartyOpen}
        onClose={() => {
          setQuickVehicleInput('');
          setQuickVehiclesList([]);
          setQuickAddPartyOpen(false);
        }}
        title="Quick Add Party"
        actions={
          <DialogActions>
            <Button onClick={() => {
              setQuickVehicleInput('');
              setQuickVehiclesList([]);
              setQuickAddPartyOpen(false);
            }} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => quickPartyFormik.handleSubmit()} variant="contained" color="primary">
              Save Party
            </Button>
          </DialogActions>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <Box>
            <ThemeInput name="partyName" label="Party Name *" formik={quickPartyFormik} />
          </Box>
          <Box>
            <ThemeInput name="mobileNo" label="Mobile Number * (10 digits)" formik={quickPartyFormik} />
          </Box>
          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="address" label="Address" multiline rows={2} formik={quickPartyFormik} />
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
                value={quickVehicleInput}
                onChange={(e) => setQuickVehicleInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQuickVehicle())}
                sx={{ flexGrow: 1 }}
              />
              <Button variant="outlined" onClick={handleAddQuickVehicle} startIcon={<AddIcon />}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickVehiclesList.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  No vehicle numbers added.
                </Typography>
              ) : (
                quickVehiclesList.map((veh, idx) => (
                  <Chip
                    key={idx}
                    label={veh}
                    onDelete={() => handleRemoveQuickVehicle(idx)}
                    color="primary"
                    variant="outlined"
                  />
                ))
              )}
            </Box>
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="remark" label="Remark" multiline rows={2} formik={quickPartyFormik} />
          </Box>
        </Box>
      </ThemeDialog>

      {/* History Drawer */}
      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={handleCloseHistory}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 550, md: 650 }, p: 3 },
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

        {historyData && selectedParty && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflowY: 'auto' }}>
            {/* Party Summary Info */}
            <Paper sx={{ p: 2.5, bgcolor: '#f8f9fa', border: '1px solid #dadce0', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                {selectedParty.partyName}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5 }}>
                <Box sx={{ gridColumn: 'span 3' }}>
                  <Typography variant="caption" color="textSecondary">Mobile:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedParty.mobileNo}</Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 3' }}>
                  <Typography variant="caption" color="textSecondary">Address:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedParty.address || '-'}</Typography>
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

      {/* Payment In dialog for specific bill */}
      <ThemeDialog
        open={paymentInDialogOpen}
        onClose={() => setPaymentInDialogOpen(false)}
        title={`Record Payment In for ${selectedBill?.billNo}`}
        actions={
          <DialogActions>
            <Button onClick={() => setPaymentInDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => paymentFormik.handleSubmit()} variant="contained" color="success">
              Save Payment
            </Button>
          </DialogActions>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              size="small"
              label="Customer / Party"
              value={(selectedBill?.partyId && typeof selectedBill.partyId === 'object') ? (selectedBill.partyId as PartyData).partyName : ''}
              disabled
              variant="filled"
            />
          </Box>

          <Box sx={{ gridColumn: 'span 2', bgcolor: '#e8f0fe', p: 1.5, borderRadius: 1.5, border: '1px solid #1a73e8' }}>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              Bill Pending Amount: {selectedBill ? formatCurrency(selectedBill.pendingAmount || 0) : '₹0'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              You can record any payment amount up to this limit.
            </Typography>
          </Box>

          <Box>
            <ThemeDatePicker name="paymentDate" label="Payment Date *" formik={paymentFormik} />
          </Box>

          <Box>
            <ThemeInput 
              name="amount" 
              label="Amount Received *" 
              type="number" 
              formik={paymentFormik} 
            />
          </Box>

          <Box>
            <FormControl fullWidth size="small" error={paymentFormik.touched.paymentMode && Boolean(paymentFormik.errors.paymentMode)}>
              <InputLabel id="bill-paymentMode-label">Payment Mode *</InputLabel>
              <Select
                labelId="bill-paymentMode-label"
                id="paymentMode"
                name="paymentMode"
                value={paymentFormik.values.paymentMode}
                onChange={paymentFormik.handleChange}
                onBlur={paymentFormik.handleBlur}
                label="Payment Mode *"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
              {paymentFormik.touched.paymentMode && paymentFormik.errors.paymentMode && (
                <FormHelperText>{paymentFormik.errors.paymentMode}</FormHelperText>
              )}
            </FormControl>
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="remark" label="Remark" multiline rows={2} formik={paymentFormik} />
          </Box>
        </Box>
      </ThemeDialog>
    </Box>
  );
}
