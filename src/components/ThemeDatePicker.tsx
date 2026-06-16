import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface ThemeDatePickerProps extends Omit<TextFieldProps, 'name'> {
  name: string;
  formik: any;
}

export const ThemeDatePicker: React.FC<ThemeDatePickerProps> = ({ name, formik, ...props }) => {
  const isTouched = formik.touched[name];
  const errorMessage = formik.errors[name];

  // Format value to YYYY-MM-DD for standard html date input
  const getValue = () => {
    const rawVal = formik.values[name];
    if (!rawVal) return '';
    try {
      const date = new Date(rawVal);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <TextField
      fullWidth
      id={name}
      name={name}
      type="date"
      value={getValue()}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={isTouched && Boolean(errorMessage)}
      helperText={isTouched && errorMessage}
      size="small"
      variant="outlined"
      slotProps={{
        inputLabel: {
          shrink: true,
        }
      }}
      {...props}
    />
  );
};
