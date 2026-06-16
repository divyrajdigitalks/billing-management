import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, SelectProps } from '@mui/material';

interface Option {
  value: string | number;
  label: string;
}

interface ThemeSelectProps extends Omit<SelectProps, 'name'> {
  name: string;
  label: string;
  options: Option[];
  formik: any;
}

export const ThemeSelect: React.FC<ThemeSelectProps> = ({ name, label, options, formik, ...props }) => {
  const isTouched = formik.touched[name];
  const errorMessage = formik.errors[name];

  return (
    <FormControl fullWidth error={isTouched && Boolean(errorMessage)} size="small">
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={formik.values[name] ?? ''}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        label={label}
        {...props}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {isTouched && errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
};
