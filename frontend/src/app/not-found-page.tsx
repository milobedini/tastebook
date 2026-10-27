import { Link } from 'react-router';

import { Button, Page } from '../ui';

export const NotFoundPage = () => (
  <Page>
    <title>Page not found · Tastebook</title>
    <h1>Page not found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <Button asChild className="self-start">
      <Link to="/">Back to Tastebook</Link>
    </Button>
  </Page>
);
