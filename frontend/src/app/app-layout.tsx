import { Outlet, useLocation } from 'react-router';

import { Toaster, TopBar, type TopBarAccount, toast } from '../dino';
import { useSession, useSignOut } from '../households';
import { useRecipeSearch } from '../recipes';

const SIGN_IN_PATH = '/sign-in';

const SIGN_OUT_FAILED = "Couldn't sign out. Check your connection and try again.";

const useAccountEnd = (): TopBarAccount | undefined => {
  const { pathname, search } = useLocation();
  const { account, isPending, isError } = useSession();
  const signOut = useSignOut();

  // Until it's known who is signed in the bar shows neither end, and the sign-in page has no use for one.
  if (isPending || isError || pathname === SIGN_IN_PATH) {
    return undefined;
  }
  if (!account) {
    return { status: 'signed-out', signInTo: `${SIGN_IN_PATH}?next=${encodeURIComponent(pathname + search)}` };
  }
  return {
    status: 'signed-in',
    name: account.name,
    menuItems: [
      { kind: 'link', label: 'Account', to: '/account' },
      { kind: 'link', label: 'Household', to: '/household' },
      {
        kind: 'action',
        label: 'Sign out',
        onSelect: () => signOut.mutate(undefined, { onError: () => toast.error(SIGN_OUT_FAILED) })
      }
    ]
  };
};

export const AppLayout = () => {
  const { searchText, changeSearchText } = useRecipeSearch();
  const account = useAccountEnd();
  return (
    <>
      <TopBar
        searchLabel="Search recipes"
        searchValue={searchText}
        onSearchValueChange={changeSearchText}
        account={account}
      />
      <Outlet />
      <Toaster />
    </>
  );
};
