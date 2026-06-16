import React from 'react';
import { Card, Typography, Box } from '@mui/material';

interface ThemeCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  color?: string;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ title, value, icon, subtitle, color = '#1a73e8' }) => {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6px',
          height: '100%',
          backgroundColor: color,
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pl: 1 }}>
        <Box>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, textTransform: 'uppercase', tracking: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#202124' }}>
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      {subtitle && (
        <Typography variant="caption" color="textSecondary" sx={{ pl: 1, mt: 'auto' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};
