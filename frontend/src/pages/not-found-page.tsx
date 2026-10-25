import { Link } from 'react-router';

export const NotFoundPage = () => (
  <main>
    <h1>Page not found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/">Back to Tastebook</Link>
  </main>
);
