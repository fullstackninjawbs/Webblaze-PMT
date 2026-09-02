import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPage: () => void;
}

export function usePagination(defaultLimit = 20): UsePaginationReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', String(newPage));
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
          next.set('limit', String(newLimit));
          next.set('page', '1'); // Reset to page 1 when limit changes
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
        next.set('page', '1');
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
