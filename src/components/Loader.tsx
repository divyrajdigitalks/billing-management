import React from 'react';
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material';

interface LoaderProps {
  open: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ open, message = 'Loading...' }) => {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999, display: 'flex', flexDirection: 'column', gap: 2 }}
      open={open}
    >
      <CircularProgress color="inherit" />
      {message && (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      )}
    </Backdrop>
  );
};
export default Loader;
