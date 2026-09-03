import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPage: () => void;
}

export function usePagination(defaultLimit = 20, prefix = ''): UsePaginationReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = `${prefix}page`;
  const limitParam = `${prefix}limit`;

  const page = parseInt(searchParams.get(pageParam) || '1', 10);
  const limit = parseInt(searchParams.get(limitParam) || String(defaultLimit), 10);

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(pageParam, String(newPage));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(limitParam, String(newLimit));
          next.set(pageParam, '1'); // Reset to page 1 when limit changes
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const resetPage = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(pageParam, '1');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return useMemo(
    () => ({
      page,
      limit,
      setPage,
      setLimit,
      resetPage,
    }),
    [page, limit, setPage, setLimit, resetPage]
  );
}
