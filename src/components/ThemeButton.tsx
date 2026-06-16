import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface ThemeButtonProps extends ButtonProps {
  loading?: boolean;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({ children, loading = false, disabled, ...props }) => {
  return (
    <Button
      disabled={disabled || loading}
      variant="contained"
      color="primary"
      {...props}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : children}
    </Button>
  );
};
