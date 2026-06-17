import API from './api';

export interface PartyData {
  _id?: string;
  partyName: string;
  mobileNo: string;
  address?: string;
  vehicleNumbers?: string[];
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  totalBillAmount?: number;
  totalPaidAmount?: number;
  totalDueAmount?: number;
}

export interface GetPartiesResponse {
  parties: PartyData[];
  total: number;
  page: number;
  pages: number;
}

export const getParties = async (params?: { search?: string; page?: number; limit?: number; sortBy?: string; order?: string; status?: string }) => {
  const response = await API.get<GetPartiesResponse>('/party', { params });
  return response.data;
};

export const getPartyById = async (id: string) => {
  const response = await API.get<PartyData>(`/party/${id}`);
  return response.data;
};

export const createParty = async (data: PartyData) => {
  const response = await API.post<PartyData>('/party', data);
  return response.data;
};

export const updateParty = async (id: string, data: PartyData) => {
  const response = await API.put<PartyData>(`/party/${id}`, data);
  return response.data;
};

export const deleteParty = async (id: string) => {
  const response = await API.delete<{ message: string }>(`/party/${id}`);
  return response.data;
};
