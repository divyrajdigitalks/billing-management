import API from './api';
import { PartyData } from './partyService';

export interface PaymentData {
  _id?: string;
  partyId: string | PartyData;
  paymentDate: string | Date;
  amount: number;
  paymentMode: 'Cash' | 'Bank' | 'UPI';
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetPaymentsResponse {
  payments: PaymentData[];
  total: number;
  page: number;
  pages: number;
}

export const getPayments = async (params?: { search?: string; page?: number; limit?: number }) => {
  const response = await API.get<GetPaymentsResponse>('/payment', { params });
  return response.data;
};

export const getPaymentById = async (id: string) => {
  const response = await API.get<PaymentData>(`/payment/${id}`);
  return response.data;
};

export const createPayment = async (data: Omit<PaymentData, '_id'>) => {
  const response = await API.post<PaymentData>('/payment', data);
  return response.data;
};

export const updatePayment = async (id: string, data: Partial<PaymentData>) => {
  const response = await API.put<PaymentData>(`/payment/${id}`, data);
  return response.data;
};

export const deletePayment = async (id: string) => {
  const response = await API.delete<{ message: string }>(`/payment/${id}`);
  return response.data;
};
