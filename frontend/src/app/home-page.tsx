import { Link } from 'react-router';

import { Button, ErrorWithRetry, Page, Wordmark } from '../dino';
import { useHealth } from './health-api';

// en-GB pins the 24-hour "15:42" shape; the time zone stays the visitor's own.
const checkTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

type LastCheckedProps = { at: number };

const LastChecked = ({ at }: LastCheckedProps) => (
  <p className="text-muted text-small">Last checked at {checkTime.format(at)}.</p>
);

const ApiStatus = () => {
  const { data, dataUpdatedAt, errorUpdatedAt, refetch } = useHealth();

  const lastCheckedAt = Math.max(dataUpdatedAt, errorUpdatedAt);
  // The timestamps, which a re-check leaves alone, say what the last check found.
  if (lastCheckedAt === 0) {
    return <p className="text-muted text-small">Checking the API…</p>;
  }
  if (data === undefined || errorUpdatedAt > dataUpdatedAt) {
    return (
      <>
        <ErrorWithRetry title="Couldn't reach the API" onRetry={refetch}>
          Check your connection, then try again.
        </ErrorWithRetry>
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
    <h1>
      <Wordmark />
    </h1>
    <Button asChild className="self-start">
      <Link to="/recipes">Browse recipes</Link>
    </Button>
    <ApiStatus />
  </Page>
);
