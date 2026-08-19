import AppRoutes from './routes';
import { useGetMeQuery } from './features/auth/auth.slice';
import { Center, Loader } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useLocation } from 'react-router-dom';
import '@mantine/notifications/styles.css';

function App() {
  const location = useLocation();
  const isGuestRoute = ['/login', '/forgot-password', '/reset-password'].includes(location.pathname);

  // Fire the rehydration query on app mount, unless on a guest route
  const { isLoading } = useGetMeQuery(undefined, { skip: isGuestRoute });

  if (isLoading) {
    return (
      <Center h="100vh" bg="#f8f9fa">
        <Loader color="blue" type="bars" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Notifications position="top-right" zIndex={1000} />
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
