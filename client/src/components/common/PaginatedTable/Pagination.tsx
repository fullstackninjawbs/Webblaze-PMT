import React from 'react';
import { Group, Pagination as MantinePagination, Select, Text, Box } from '@mantine/core';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange, onLimitChange }) => {
  if (!meta) return null;

  const { page, limit, total, totalPages } = meta;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <Group justify="space-between" align="center" mt="md">
      <Box>
        <Text size="sm" c="dimmed">
          Showing <Text component="span" fw={500} c="dark">{startItem}</Text> to <Text component="span" fw={500} c="dark">{endItem}</Text> of <Text component="span" fw={500} c="dark">{total}</Text> entries
        </Text>
      </Box>

      <Group gap="md">
        <Group gap="xs" align="center">
          <Text size="sm" c="dimmed">Rows per page:</Text>
          <Select
            value={String(limit)}
            onChange={(val) => onLimitChange(Number(val))}
            data={['10', '20', '50', '100']}
            size="xs"
            w={70}
            styles={{ input: { paddingLeft: 8, paddingRight: 8 } }}
          />
        </Group>

        <MantinePagination
          value={page}
          onChange={onPageChange}
          total={totalPages}
          color="blue"
          size="sm"
          radius="md"
        />
      </Group>
    </Group>
  );
};
