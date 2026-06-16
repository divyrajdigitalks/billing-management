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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

import { RootState, AppDispatch } from '../../redux/store';
import { fetchPayments, createPayment, updatePayment, deletePayment } from '../../redux/paymentSlice';
import { fetchParties, createParty } from '../../redux/partySlice';
import { fetchPartyHistory, clearHistory } from '../../redux/historySlice';
import { ThemeTable } from '../../components/ThemeTable';
import { ThemeDialog } from '../../components/ThemeDialog';
import { ThemeInput } from '../../components/ThemeInput';
import { ThemeDatePicker } from '../../components/ThemeDatePicker';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Loader } from '../../components/Loader';
import { showToast } from '../../components/LayoutShell';
import { PaymentData } from '../../services/paymentService';
import { PartyData } from '../../services/partyService';

const validationSchema = Yup.object().shape({
  partyId: Yup.string().required('Party selection is required'),
  paymentDate: Yup.date().required('Payment date is required'),
  amount: Yup.number()
    .required('Received amount is required')
    .min(0.01, 'Amount must be greater than zero'),
  paymentMode: Yup.string()
    .required('Payment mode is required')
    .oneOf(['Cash', 'Bank', 'UPI'], 'Invalid Payment Mode'),
  remark: Yup.string(),
});

export default function PaymentIn() {
  const dispatch = useDispatch<AppDispatch>();
  const { payments, total, page, loading, error } = useSelector((state: RootState) => state.payment);
  const { parties } = useSelector((state: RootState) => state.party);
  const { historyData, loading: historyLoading } = useSelector((state: RootState) => state.history);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAddPartyOpen, setQuickAddPartyOpen] = useState(false);
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [selectedParty, setSelectedParty] = useState<PartyData | null>(null);
  const [selectedPartyPending, setSelectedPartyPending] = useState(0);

  useEffect(() => {
    // Load parties for dropdown once on mount
    dispatch(fetchParties({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    loadPayments();
  }, [currentPage, rowsPerPage, search, dispatch]);

  const loadPayments = () => {
    dispatch(fetchPayments({
      search,
      page: currentPage + 1,
      limit: rowsPerPage,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
    setCurrentPage(0);
  };

  const handlePartyChange = async (partyId: string) => {
    formik.setFieldValue('partyId', partyId);
    if (partyId) {
      try {
        const response = await dispatch(fetchPartyHistory(partyId)).unwrap();
        setSelectedPartyPending(response.totalPendingAmount);
      } catch (err) {
        setSelectedPartyPending(0);
      }
    } else {
      setSelectedPartyPending(0);
    }
  };

  const formik = useFormik({
    initialValues: {
      partyId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMode: 'Cash' as 'Cash' | 'Bank' | 'UPI',
      remark: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Validation: Entered amount must not exceed current pending amount
        const currentAmount = selectedPayment ? selectedPayment.amount : 0;
        const maxAllowed = selectedPartyPending + currentAmount;
        if (values.amount > maxAllowed) {
          showToast(`Payment amount cannot exceed the pending amount of Rs. ${maxAllowed}`, 'error');
          return;
        }

        if (selectedPayment && selectedPayment._id) {
          // Update
          await dispatch(updatePayment({ id: selectedPayment._id, data: values })).unwrap();
          showToast('Payment record updated successfully', 'success');
        } else {
          // Create
          await dispatch(createPayment(values)).unwrap();
          showToast('Payment recorded successfully', 'success');
        }
        setFormOpen(false);
        loadPayments();
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
        .matches(/^[6-9]\d{9}$/, 'Mobile number must be exactly 10 digits starting with 6-9'),
      address: Yup.string(),
      remark: Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        const newParty = await dispatch(createParty({ ...values, vehicleNumbers: [] })).unwrap();
        showToast('Party created successfully!', 'success');
        await dispatch(fetchParties({ limit: 1000 }));
        // Select the newly created party
        handlePartyChange(newParty._id || '');
        setQuickAddPartyOpen(false);
        quickPartyFormik.resetForm();
      } catch (err: any) {
        showToast(err || 'Failed to create party', 'error');
      }
    }
  });

  const handleOpenAddForm = () => {
    setSelectedPayment(null);
    setSelectedPartyPending(0);
    formik.resetForm();
    formik.setFieldValue('paymentDate', new Date().toISOString().split('T')[0]);
    formik.setFieldValue('paymentMode', 'Cash');
    setFormOpen(true);
  };

  const handleOpenEditForm = (payment: PaymentData) => {
    setSelectedPayment(payment);
    const pId = typeof payment.partyId === 'object' ? payment.partyId._id : payment.partyId;

    if (pId) {
      handlePartyChange(pId);
    }

    formik.setValues({
      partyId: pId || '',
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
      amount: payment.amount || 0,
      paymentMode: payment.paymentMode || 'Cash',
      remark: payment.remark || '',
    });
    setFormOpen(true);
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


  const handleOpenDeleteDialog = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPayment && selectedPayment._id) {
      try {
        await dispatch(deletePayment(selectedPayment._id)).unwrap();
        showToast('Payment record deleted successfully', 'success');
        setDeleteDialogOpen(false);
        loadPayments();
      } catch (err: any) {
        showToast(err || 'Failed to delete payment', 'error');
      }
    }
  };

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
    {
      id: 'partyName',
      label: 'Party Name',
      minWidth: 150,
      format: (_: any, row: PaymentData) => {
        const party = row.partyId as PartyData;
        return party ? party.partyName : '-';
      }
    },
    {
      id: 'mobileNo',
      label: 'Mobile No',
      minWidth: 120,
      format: (_: any, row: PaymentData) => {
        const party = row.partyId as PartyData;
        return party ? party.mobileNo : '-';
      }
    },
    {
      id: 'paymentDate',
      label: 'Payment Date',
      minWidth: 120,
      format: (val: string) => formatDate(val)
    },
    {
      id: 'amount',
      label: 'Amount Received',
      minWidth: 120,
      align: 'right' as const,
      format: (val: number) => formatCurrency(val)
    },
    { id: 'paymentMode', label: 'Payment Mode', minWidth: 120 },
    { id: 'remark', label: 'Remark', minWidth: 150 },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 160,
      align: 'right' as const,
      format: (_: any, row: PaymentData) => {
        const party = row.partyId as PartyData;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {party && (
              <IconButton color="info" onClick={() => handleOpenHistory(party._id || '', party)} title="View History">
                <HistoryIcon />
              </IconButton>
            )}
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
            Payment In
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Record customer collections, handle payment modes, and update running accounts
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddForm}>
          Record Payment
        </Button>
      </Box>

      {/* Filter and Search */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search by Payment Mode or Remark..."
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

      {/* Payments Table */}
      <ThemeTable
        columns={columns}
        rows={payments}
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
        title={selectedPayment ? 'Edit Payment Record' : 'Record Payment In'}
        actions={
          <DialogActions>
            <Button onClick={() => setFormOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => formik.handleSubmit()} variant="contained" color="primary">
              Save Payment
            </Button>
          </DialogActions>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          {/* Party Selection Dropdown with quick add */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
            <FormControl fullWidth size="small" error={formik.touched.partyId && Boolean(formik.errors.partyId)}>
              <InputLabel id="partyId-label">Select Party *</InputLabel>
              <Select
                labelId="partyId-label"
                id="partyId"
                name="partyId"
                value={formik.values.partyId}
                onChange={(e) => handlePartyChange(e.target.value)}
                onBlur={formik.handleBlur}
                label="Select Party *"
                disabled={Boolean(selectedPayment)} // Cannot edit party once created
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {parties.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.partyName}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.partyId && formik.errors.partyId && (
                <FormHelperText>{formik.errors.partyId}</FormHelperText>
              )}
              {formik.values.partyId && (
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                  Current Outstanding Pending Balance: {formatCurrency(selectedPartyPending)}
                </Typography>
              )}
            </FormControl>
            {!selectedPayment && (
              <Button
                variant="outlined"
                onClick={() => setQuickAddPartyOpen(true)}
                sx={{ minWidth: 100, height: 40 }}
              >
                + Add
              </Button>
            )}
          </Box>

          <Box>
            <ThemeDatePicker name="paymentDate" label="Payment Date *" formik={formik} />
          </Box>

          <Box>
            <ThemeInput name="amount" label="Amount Received *" type="number" formik={formik} />
          </Box>

          {/* Payment Mode Selection */}
          <Box>
            <FormControl fullWidth size="small" error={formik.touched.paymentMode && Boolean(formik.errors.paymentMode)}>
              <InputLabel id="paymentMode-label">Payment Mode *</InputLabel>
              <Select
                labelId="paymentMode-label"
                id="paymentMode"
                name="paymentMode"
                value={formik.values.paymentMode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Payment Mode *"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
              {formik.touched.paymentMode && formik.errors.paymentMode && (
                <FormHelperText>{formik.errors.paymentMode}</FormHelperText>
              )}
            </FormControl>
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="remark" label="Remark" multiline rows={2} formik={formik} />
          </Box>
        </Box>
      </ThemeDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Payment Record"
        message="Are you sure you want to delete this payment record? This action will automatically recalculate and increase the pending amount."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Quick Add Party Dialog */}
      <ThemeDialog
        open={quickAddPartyOpen}
        onClose={() => setQuickAddPartyOpen(false)}
        title="Quick Add Party"
        actions={
          <DialogActions>
            <Button onClick={() => setQuickAddPartyOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={() => quickPartyFormik.handleSubmit()} variant="contained" color="primary">
              Save Party
            </Button>
          </DialogActions>
        }
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <ThemeInput name="partyName" label="Party Name *" formik={quickPartyFormik} />
          </Box>
          <Box>
            <ThemeInput name="mobileNo" label="Mobile Number * (10 digits)" formik={quickPartyFormik} />
          </Box>
          <Box sx={{ gridColumn: 'span 2' }}>
            <ThemeInput name="address" label="Address" multiline rows={2} formik={quickPartyFormik} />
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
    </Box>
  );
}
