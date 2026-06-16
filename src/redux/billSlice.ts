import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as billService from '../services/billService';

interface BillState {
  bills: billService.BillData[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
}

const initialState: BillState = {
  bills: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
};

export const fetchBills = createAsyncThunk(
  'bill/fetchBills',
  async (params: { search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      return await billService.getBills(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bills');
    }
  }
);

export const createBill = createAsyncThunk(
  'bill/createBill',
  async (data: billService.CreateBillData, { rejectWithValue }) => {
    try {
      return await billService.createBill(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create bill');
    }
  }
);

export const updateBill = createAsyncThunk(
  'bill/updateBill',
  async ({ id, data }: { id: string; data: Partial<billService.BillData> }, { rejectWithValue }) => {
    try {
      return await billService.updateBill(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update bill');
    }
  }
);

export const deleteBill = createAsyncThunk(
  'bill/deleteBill',
  async (id: string, { rejectWithValue }) => {
    try {
      await billService.deleteBill(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete bill');
    }
  }
);

const billSlice = createSlice({
  name: 'bill',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bills
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action: PayloadAction<billService.GetBillsResponse>) => {
        state.loading = false;
        state.bills = action.payload.bills;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Bill
      .addCase(createBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Bill
      .addCase(updateBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBill.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Bill
      .addCase(deleteBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBill.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = billSlice.actions;
export default billSlice.reducer;
