import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row: any) => React.ReactNode;
}

interface ThemeTableProps {
  columns: Column[];
  rows: any[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  loading?: boolean;
}

export const ThemeTable: React.FC<ThemeTableProps> = ({
  columns,
  rows,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Loading records...
          </Typography>
        </Box>
      );
    }

    if (rows.length === 0) {
      return (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No records found.
          </Typography>
        </Box>
      );
    }

    if (isMobile) {
      return (
        <Box sx={{ p: 2 }}>
          {rows.map((row, index) => (
            <Card
              key={row._id || index}
              sx={{
                mb: 2,
                border: '1px solid #dadce0',
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    const renderedValue = column.format ? column.format(value, row) : value;
                    const isActions = column.id === 'actions';

                    return (
                      <Box
                        key={column.id}
                        sx={{
                          gridColumn: isActions ? 'span 2' : 'auto',
                          mt: isActions ? 1 : 0,
                          textAlign: column.align || 'left',
                        }}
                      >
                        {!isActions && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontWeight: 500 }}>
                            {column.label}
                          </Typography>
                        )}
                        {isActions ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f3f4', pt: 1.5, mt: 0.5 }}>
                            {renderedValue}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#202124' }}>
                            {renderedValue !== undefined && renderedValue !== null ? renderedValue : '-'}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    return (
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 600, backgroundColor: '#f1f3f4' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={row._id || index}>
                {columns.map((column) => {
                  const value = row[column.id];
                  return (
                    <TableCell key={column.id} align={column.align}>
                      {column.format ? column.format(value, row) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid #dadce0', boxShadow: 'none' }}>
      {renderTableContent()}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={onRowsPerPageChange ? handleChangeRowsPerPage : undefined}
      />
    </Paper>
  );
};
