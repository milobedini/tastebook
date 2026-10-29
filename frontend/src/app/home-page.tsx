import { useCallback, useState } from 'react';
import { Link } from 'react-router';

import { Banner, Button, Page } from '../dino';
import { useHealth } from './health-api';

type ApiUnreachableProps = {
  onRetry: () => void;
};

const ApiUnreachable = ({ onRetry }: ApiUnreachableProps) => (
  <>
    <Banner tone="danger" title="The API is unreachable." />
    <Button variant="secondary" className="self-start" onClick={onRetry}>
      Try again
    </Button>
  </>
);

// en-GB pins the 24-hour "15:42" shape; the time zone stays the visitor's own.
const checkTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

type LastCheckedProps = { at: number };

const LastChecked = ({ at }: LastCheckedProps) => (
  <p className="text-muted text-small">Last checked at {checkTime.format(at)}.</p>
);

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
    return <p className="text-muted text-small">Checking the API…</p>;
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
      <p className="text-muted text-small">
        API: {data.status}, database: {data.database}
      </p>
      <p className="text-muted text-small">API version {data.version}</p>
      <LastChecked at={lastCheckedAt} />
    </>
  );
};

export const HomePage = () => (
  <Page>
    <title>Tastebook</title>
    <h1 className="font-extrabold text-cobalt text-display-xl">Tastebook</h1>
    <Button asChild className="self-start">
      <Link to="/recipes">Browse recipes</Link>
    </Button>
    <ApiStatus />
  </Page>
);
