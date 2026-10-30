import { Outlet, useLocation } from 'react-router';

import { TopBar, type TopBarAccount } from '../dino';
import { useSession, useSignOut } from '../households';
import { useRecipeSearch } from '../recipes';

const SIGN_IN_PATH = '/sign-in';

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
  // The name is blank until TAS-103 asks for it, so the avatar shows its icon and is named "Account".
  return {
    status: 'signed-in',
    name: '',
    menuItems: [{ kind: 'action', label: 'Sign out', onSelect: () => signOut.mutate() }]
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
    </>
  );
};
