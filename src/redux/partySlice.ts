import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as partyService from '../services/partyService';

interface PartyState {
  parties: partyService.PartyData[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
}

const initialState: PartyState = {
  parties: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
};

export const fetchParties = createAsyncThunk(
  'party/fetchParties',
  async (params: { search?: string; page?: number; limit?: number; sortBy?: string; order?: string; status?: string } | undefined, { rejectWithValue }) => {
    try {
      return await partyService.getParties(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch parties');
    }
  }
);

export const createParty = createAsyncThunk(
  'party/createParty',
  async (data: partyService.PartyData, { rejectWithValue }) => {
    try {
      return await partyService.createParty(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create party');
    }
  }
);

export const updateParty = createAsyncThunk(
  'party/updateParty',
  async ({ id, data }: { id: string; data: partyService.PartyData }, { rejectWithValue }) => {
    try {
      return await partyService.updateParty(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update party');
    }
  }
);

export const deleteParty = createAsyncThunk(
  'party/deleteParty',
  async (id: string, { rejectWithValue }) => {
    try {
      await partyService.deleteParty(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete party');
    }
  }
);

const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Parties
      .addCase(fetchParties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParties.fulfilled, (state, action: PayloadAction<partyService.GetPartiesResponse>) => {
        state.loading = false;
        state.parties = action.payload.parties;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchParties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Party
      .addCase(createParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParty.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Party
      .addCase(updateParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateParty.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Party
      .addCase(deleteParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParty.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = partySlice.actions;
export default partySlice.reducer;
