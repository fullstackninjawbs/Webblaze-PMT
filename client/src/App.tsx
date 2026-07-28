import AppRoutes from './routes';
import { useGetMeQuery } from './features/auth/auth.slice';
import { Center, Loader } from '@mantine/core';

function App() {
  // Fire the rehydration query on app mount
  const { isLoading } = useGetMeQuery(undefined);

  if (isLoading) {
    return (
      <Center h="100vh" bg="#f8f9fa">
        <Loader color="blue" type="bars" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
