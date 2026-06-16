'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Box, Paper, CircularProgress, Alert, useMediaQuery, useTheme } from '@mui/material';
import { fetchDashboardSummary } from '../redux/dashboardSlice';
import { RootState, AppDispatch } from '../redux/store';
import { ThemeCard } from '../components/ThemeCard';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import ErrorIcon from '@mui/icons-material/Error';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { summary, loading, error } = useSelector((state: RootState) => state.dashboard);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <Alert severity="error">Failed to load dashboard: {error}</Alert>
      </Box>
    );
  }

  const data = summary || {
    totalParties: 0,
    totalBills: 0,
    totalBillAmount: 0,
    totalReceivedAmount: 0,
    totalPendingAmount: 0,
    monthlyChartData: [],
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#202124' }}>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Overview of your billing and collection analytics
        </Typography>
      </Box>

      {/* Cards Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 3 }}>
        <Box>
          <ThemeCard
            title="Total Parties"
            value={data.totalParties}
            icon={<PeopleIcon />}
            color="#1a73e8"
            subtitle="Registered parties"
          />
        </Box>
        <Box>
          <ThemeCard
            title="Total Bills"
            value={data.totalBills}
            icon={<ReceiptIcon />}
            color="#e37400"
            subtitle="Bills generated"
          />
        </Box>
        <Box>
          <ThemeCard
            title="Total Billed"
            value={formatCurrency(data.totalBillAmount)}
            icon={<AttachMoneyIcon />}
            color="#137333"
            subtitle="Gross invoice value"
          />
        </Box>
        <Box>
          <ThemeCard
            title="Total Received"
            value={formatCurrency(data.totalReceivedAmount)}
            icon={<PaymentIcon />}
            color="#188038"
            subtitle="Collections received"
          />
        </Box>
        <Box>
          <ThemeCard
            title="Total Pending"
            value={formatCurrency(data.totalPendingAmount)}
            icon={<ErrorIcon />}
            color="#d93025"
            subtitle="Outstanding balance"
          />
        </Box>
      </Box>

      {/* Charts Section - Hide on Mobile */}
      {!isMobile && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Monthly Billing Chart */}
          <Box>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Monthly Billing
              </Typography>
              {data.monthlyChartData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="textSecondary">No data available</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyChartData}>
                      <defs>
                        <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Area type="monotone" dataKey="billing" name="Billed Amount" stroke="#1a73e8" fillOpacity={1} fill="url(#colorBilling)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Monthly Collection Chart */}
          <Box>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Monthly Collection
              </Typography>
              {data.monthlyChartData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="textSecondary">No data available</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="collection" name="Received Amount" fill="#188038" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}
