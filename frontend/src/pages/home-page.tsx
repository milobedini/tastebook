import { useHealth } from '../api/health';

const ApiStatus = () => {
  const { data, isPending, isError } = useHealth();

  if (isPending) {
    return <p>Checking the API…</p>;
  }
  if (isError) {
    return <p role="alert">The API is unreachable.</p>;
  }
  return (
    <p>
      API: {data.status}, database: {data.database}
    </p>
  );
};

export const HomePage = () => (
  <main>
    <h1>Tastebook</h1>
    <ApiStatus />
  </main>
);
