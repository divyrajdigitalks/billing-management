import API from './api';

export interface MonthlyChartItem {
  month: string;
  billing: number;
  collection: number;
}

export interface DashboardSummaryResponse {
  totalParties: number;
  totalBills: number;
  totalBillAmount: number;
  totalReceivedAmount: number;
  totalPendingAmount: number;
  monthlyChartData: MonthlyChartItem[];
}

export const getDashboardSummary = async () => {
  const response = await API.get<DashboardSummaryResponse>('/dashboard/summary');
  return response.data;
};
