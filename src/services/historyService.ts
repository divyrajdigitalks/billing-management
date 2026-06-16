import API from './api';
import { PartyData } from './partyService';

export interface Transaction {
  _id: string;
  date: string;
  type: 'Bill Created' | 'Payment Received';
  billNo: string;
  billAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  runningBalance: number;
  remark: string;
}

export interface HistoryResponse {
  partyInfo: PartyData;
  totalBillAmount: number;
  totalReceivedAmount: number;
  totalPendingAmount: number;
  transactions: Transaction[];
}

export const getPartyHistory = async (partyId: string) => {
  const response = await API.get<HistoryResponse>(`/history/${partyId}`);
  return response.data;
};
