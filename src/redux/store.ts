import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import billReducer from './billSlice';
import paymentReducer from './paymentSlice';
import historyReducer from './historySlice';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    bill: billReducer,
    payment: paymentReducer,
    history: historyReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
