import { configureStore, isRejectedWithValue, Middleware } from '@reduxjs/toolkit';
import { baseApi } from './api';
import authReducer from '../features/auth/auth.slice';
import { notifications } from '@mantine/notifications';

const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const payload = (action as any).payload;
    const message = payload?.data?.error?.message || payload?.data?.message || payload?.error || 'An unexpected error occurred';
    
    notifications.show({
      title: 'Error',
      message: message,
      color: 'red',
    });
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, rtkQueryErrorLogger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
