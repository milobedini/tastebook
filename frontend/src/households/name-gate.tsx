import { Navigate, Outlet, useLocation } from 'react-router';

import { useSession } from './session-api';

export const WELCOME_PATH = '/welcome';
const SIGN_IN_PATH = '/sign-in';

// A signed-in account with no name gives one before anything else. The sign-in page sends you on to `next`
// itself, so the gate picks you up there, with the right `next`.
export const NameGate = () => {
  const { account } = useSession();
  const { pathname, search } = useLocation();
  if (account?.name === '' && pathname !== WELCOME_PATH && pathname !== SIGN_IN_PATH) {
    return <Navigate to={`${WELCOME_PATH}?next=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return <Outlet />;
};
