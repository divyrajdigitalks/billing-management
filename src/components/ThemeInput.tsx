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
      // Only allow digits and limit to 10
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    formik.setFieldValue(name, value);
  };

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
