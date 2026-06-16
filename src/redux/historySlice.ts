import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as historyService from '../services/historyService';

interface HistoryState {
  historyData: historyService.HistoryResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  historyData: null,
  loading: false,
  error: null,
};

export const fetchPartyHistory = createAsyncThunk(
  'history/fetchPartyHistory',
  async (partyId: string, { rejectWithValue }) => {
    try {
      return await historyService.getPartyHistory(partyId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch party history');
    }
  }
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistory: (state) => {
      state.historyData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartyHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartyHistory.fulfilled, (state, action: PayloadAction<historyService.HistoryResponse>) => {
        state.loading = false;
        state.historyData = action.payload;
      })
      .addCase(fetchPartyHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHistory } = historySlice.actions;
export default historySlice.reducer;
