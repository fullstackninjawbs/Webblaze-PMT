import React, { ReactNode } from 'react';
import { Box, LoadingOverlay } from '@mantine/core';
import { Pagination, PaginationMeta } from './Pagination';

interface PaginatedTableProps {
  children: ReactNode;
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export const PaginatedTable: React.FC<PaginatedTableProps> = ({
  children,
  meta,
  onPageChange,
  onLimitChange,
  isLoading = false,
}) => {
  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      {children}
      <Pagination
        meta={meta}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </Box>
  );
};
