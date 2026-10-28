import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '../api/client';
import type { RecipeFilters } from './recipe-filters';

export type RecipeQuery = { searchTerm: string; filters: RecipeFilters };

// Leaves out what filters nothing, so an unfiltered list asks for /api/recipes/ with no query string.
const toQuery = ({ searchTerm, filters }: RecipeQuery) => ({
  ...(searchTerm === '' ? {} : { q: searchTerm }),
  ...(filters.cuisines.length === 0 ? {} : { cuisine: filters.cuisines }),
  ...(filters.courses.length === 0 ? {} : { course: filters.courses }),
  ...(filters.difficulties.length === 0 ? {} : { difficulty: filters.difficulties }),
  ...(filters.times.total === null ? {} : { max_total: filters.times.total }),
  ...(filters.times.prep === null ? {} : { max_prep: filters.times.prep }),
  ...(filters.times.cook === null ? {} : { max_cook: filters.times.cook }),
  ...(filters.onePot ? { one_pot: true } : {}),
  ...(filters.diets.length === 0 ? {} : { diet: filters.diets }),
  ...(filters.includedIngredients.length === 0 ? {} : { include_ingredient: filters.includedIngredients }),
  ...(filters.excludedIngredients.length === 0 ? {} : { exclude_ingredient: filters.excludedIngredients })
});

export const useRecipes = (query: RecipeQuery) =>
  useQuery({
    queryKey: ['recipes', toQuery(query)],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/recipes/', { params: { query: toQuery(query) } });
      if (error || !data) {
        throw new Error('Recipes request failed');
      }
      // The query travels with its results, so previous results shown while loading keep their own empty message.
      return { query, recipes: data };
    },
    placeholderData: keepPreviousData
  });

export const useRecipe = (slug: string) =>
  useQuery({
    queryKey: ['recipes', slug],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/recipes/{slug}/', { params: { path: { slug } } });
      // A missing recipe is an answer, not a failure, so it's cached and never retried.
      if (response.status === 404) {
        return null;
      }
      if (error || !data) {
        throw new Error('Recipe request failed');
      }
      return data;
    }
  });
