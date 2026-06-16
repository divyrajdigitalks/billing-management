import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as paymentService from '../services/paymentService';

interface PaymentState {
  payments: paymentService.PaymentData[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
};

export const fetchPayments = createAsyncThunk(
  'payment/fetchPayments',
  async (params: { search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      return await paymentService.getPayments(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

export const createPayment = createAsyncThunk(
  'payment/createPayment',
  async (data: Omit<paymentService.PaymentData, '_id'>, { rejectWithValue }) => {
    try {
      return await paymentService.createPayment(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
    }
  }
);

export const updatePayment = createAsyncThunk(
  'payment/updatePayment',
  async ({ id, data }: { id: string; data: Partial<paymentService.PaymentData> }, { rejectWithValue }) => {
    try {
      return await paymentService.updatePayment(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment');
    }
  }
);

export const deletePayment = createAsyncThunk(
  'payment/deletePayment',
  async (id: string, { rejectWithValue }) => {
    try {
      await paymentService.deletePayment(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payment');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action: PayloadAction<paymentService.GetPaymentsResponse>) => {
        state.loading = false;
        state.payments = action.payload.payments;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Payment
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Payment
      .addCase(updatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Payment
      .addCase(deletePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
