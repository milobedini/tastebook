import { useCallback, useState } from 'react';

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

// en-GB pins the 24-hour "15:42" shape; the time zone stays the visitor's own.
const checkTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

type LastCheckedProps = { at: number };

const LastChecked = ({ at }: LastCheckedProps) => <p>Last checked at {checkTime.format(at)}.</p>;

const ApiStatus = () => {
  const { data, dataUpdatedAt, errorUpdatedAt, refetch } = useHealth();
  const [isRetrying, setIsRetrying] = useState(false);
  const retry = useCallback(async () => {
    setIsRetrying(true);
    await refetch();
    setIsRetrying(false);
  }, [refetch]);

  const lastCheckedAt = Math.max(dataUpdatedAt, errorUpdatedAt);
  // Re-checking a query that has never succeeded resets it to pending and clears its error, so the
  // timestamps, which a re-check leaves alone, say what the last check found. Only a visitor's retry
  // shows the checking message; automatic checks leave the current status up until they finish.
  if (lastCheckedAt === 0 || isRetrying) {
    return <p>Checking the API…</p>;
  }
  if (data === undefined || errorUpdatedAt > dataUpdatedAt) {
    return (
      <>
        <ApiUnreachable onRetry={() => void retry()} />
        <LastChecked at={lastCheckedAt} />
      </>
    );
  }
  return (
    <>
      <p>
        API: {data.status}, database: {data.database}
      </p>
      <LastChecked at={lastCheckedAt} />
    </>
  );
};

export const HomePage = () => (
  <main>
    <title>Tastebook</title>
    <h1>Tastebook</h1>
    <ApiStatus />
  </main>
);
