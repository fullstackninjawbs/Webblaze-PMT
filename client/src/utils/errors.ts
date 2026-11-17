/**
 * Message from a failed RTK Query request. The API sends { error: { message } };
 * a few older endpoints send { message }.
 */
export const getErrorMessage = (err: any, fallback = 'Something went wrong'): string =>
  err?.data?.error?.message || err?.data?.message || err?.error || err?.message || fallback;
