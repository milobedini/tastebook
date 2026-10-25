import { useCallback } from 'react';

import { useHealth } from '../api/health';

type ApiUnreachableProps = {
  onRetry: () => void;
};

const ApiUnreachable = ({ onRetry }: ApiUnreachableProps) => (
  <>
    <p role="alert">The API is unreachable.</p>
    <button type="button" onClick={onRetry}>
      Try again
    </button>
  </>
);

const ApiStatus = () => {
  const { data, isPending, isError, isFetching, refetch } = useHealth();
  const retry = useCallback(() => void refetch(), [refetch]);

  // A failed query keeps its error status while it refetches, so isPending alone would leave the message up.
  if (isPending || (isError && isFetching)) {
    return <p>Checking the API…</p>;
  }
  if (isError) {
    return <ApiUnreachable onRetry={retry} />;
  }
  return (
    <p>
      API: {data.status}, database: {data.database}
    </p>
  );
};

export const HomePage = () => (
  <main>
    <title>Tastebook</title>
    <h1>Tastebook</h1>
    <ApiStatus />
  </main>
);
