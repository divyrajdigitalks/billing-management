import API from './api';
import { PartyData } from './partyService';

export interface BillData {
  _id?: string;
  billNo?: string;
  partyId: string | PartyData;
  vehicleNumber: string;
  billDate: string | Date;
  billAmount: number;
  paidAmount?: number;
  pendingAmount?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBillData {
  partyId: string;
  vehicleNumber: string;
  billDate: string | Date;
  billAmount: number;
  receiveAmount?: number;
  remark?: string;
}

export interface GetBillsResponse {
  bills: BillData[];
  total: number;
  page: number;
  pages: number;
}

export const getBills = async (params?: { search?: string; page?: number; limit?: number }) => {
  const response = await API.get<GetBillsResponse>('/bill', { params });
  return response.data;
};

export const getBillById = async (id: string) => {
  const response = await API.get<BillData>(`/bill/${id}`);
  return response.data;
};

export const createBill = async (data: CreateBillData) => {
  const response = await API.post<BillData>('/bill', data);
  return response.data;
};

export const updateBill = async (id: string, data: Partial<BillData>) => {
  const response = await API.put<BillData>(`/bill/${id}`, data);
  return response.data;
};

export const deleteBill = async (id: string) => {
  const response = await API.delete<{ message: string }>(`/bill/${id}`);
  return response.data;
};
