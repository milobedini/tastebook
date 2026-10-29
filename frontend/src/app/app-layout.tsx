import { Outlet } from 'react-router';

import { TopBar } from '../dino';
import { useRecipeSearch } from '../recipes';

export const AppLayout = () => {
  const { searchText, changeSearchText } = useRecipeSearch();
  return (
    <>
      <TopBar searchLabel="Search recipes" searchValue={searchText} onSearchValueChange={changeSearchText} />
      <Outlet />
    </>
  );
};
