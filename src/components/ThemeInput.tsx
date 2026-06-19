import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface ThemeInputProps extends Omit<TextFieldProps, 'name'> {
  name: string;
  formik: any;
}

export const ThemeInput: React.FC<ThemeInputProps> = ({ name, formik, ...props }) => {
  const isTouched = formik.touched[name];
  const errorMessage = formik.errors[name];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // If it's a mobile number field (detect by name or label)
    const isMobileField = 
      String(name).toLowerCase().includes('mobile') || 
      (props.label && String(props.label).toLowerCase().includes('mobile'));
    
    if (isMobileField) {
      // Handle +91 prefix
      if (!value.startsWith('+91')) {
        // If user is typing, keep only digits first
        const digitsOnly = value.replace(/\D/g, '');
        value = '+91' + digitsOnly.slice(0, 10);
      } else {
        // If +91 is already there, just keep digits after that
        const digitsOnly = value.slice(3).replace(/\D/g, '').slice(0, 10);
        value = '+91' + digitsOnly;
      }
    } else if (name === 'billNo') {
      value = value.toUpperCase();
    }

    formik.setFieldValue(name, value);
  };

  // Handle initial value to add +91 prefix if needed
  React.useEffect(() => {
    const isMobileField = 
      String(name).toLowerCase().includes('mobile') || 
      (props.label && String(props.label).toLowerCase().includes('mobile'));
    
    if (isMobileField) {
      let currentValue = formik.values[name];
      if (!currentValue || !currentValue.startsWith('+91')) {
        const digitsOnly = (currentValue || '').replace(/\D/g, '').slice(0, 10);
        formik.setFieldValue(name, '+91' + digitsOnly);
      }
    }
  }, []);

  return (
    <TextField
      fullWidth
      id={name}
      name={name}
      value={formik.values[name] ?? ''}
      onChange={handleChange}
      onBlur={formik.handleBlur}
      error={isTouched && Boolean(errorMessage)}
      helperText={isTouched && errorMessage}
      size="small"
      variant="outlined"
      {...props}
    />
  );
};
