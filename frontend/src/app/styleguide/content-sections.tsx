import { CookingPot } from 'lucide-react';

import { Banner, Button, ConfirmDialog, CuisinePlate, EmptyState, RecipeCard, Toaster, toast } from '../../ui';
import { StyleguideSection } from './styleguide-section';

const recipes = [
  {
    slug: 'courgette-and-lemon-orzo',
    title: 'Courgette and lemon orzo',
    cuisine: 'italian',
    meta: ['35 min', 'Easy', 'Italian']
  },
  {
    slug: 'red-lentil-and-spinach-dal',
    title: 'Red lentil and spinach dal',
    cuisine: 'indian',
    meta: ['40 min', 'Easy', 'Indian']
  }
];

const plates = [
  { slug: 'italian', name: 'Italian' },
  { slug: 'indian', name: 'Indian' },
  { slug: 'japanese', name: 'Japanese' },
  { slug: 'mexican', name: 'Mexican' },
  { slug: 'french', name: 'French' },
  { slug: undefined, name: 'Everything else' }
];

export const RecipeCardsSection = () => (
  <StyleguideSection
    title="Recipe cards and placeholders"
    description="The cobalt rim is the recipe card's alone. No photo? A drawn plate in the cuisine's colour."
  >
    {recipes.map((recipe) => (
      <RecipeCard key={recipe.slug} title={recipe.title} to={`/recipes/${recipe.slug}`} cuisineSlug={recipe.cuisine}>
        <p className="flex flex-wrap gap-x-2.5 tabular-nums">
          {recipe.meta.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </p>
      </RecipeCard>
    ))}
    <ul className="grid grid-cols-3 gap-2">
      {plates.map((plate) => (
        <li key={plate.name} className="flex flex-col gap-1 text-center text-muted text-small">
          <CuisinePlate shape="card" cuisineSlug={plate.slug} />
          {plate.name}
        </li>
      ))}
    </ul>
    <figure className="flex flex-col gap-1 text-center text-muted text-small">
      <CuisinePlate shape="hero" cuisineSlug="japanese" />
      <figcaption>At the top of a recipe</figcaption>
    </figure>
  </StyleguideSection>
);

const showToast = () => toast('Saved to Favourites', { action: { label: 'Undo', onClick: () => undefined } });

export const FeedbackSection = () => (
  <StyleguideSection title="Feedback" description="Status colours only for status: success, warning, danger.">
    <Toaster />
    <div>
      <Button variant="secondary" onClick={showToast}>
        Show a toast
      </Button>
    </div>
    <Banner tone="warning" title="2 gaps in this import">
      Check the amounts marked in yolk before you cook it.
    </Banner>
    <Banner tone="success" title="Imported without gaps">
      From bbcgoodfood.com. It's private to your household.
    </Banner>
  </StyleguideSection>
);

export const ConfirmSection = () => (
  <StyleguideSection
    title="Confirming something you can't undo"
    description="A dialog says exactly what happens; the danger button names the action."
  >
    <div>
      <ConfirmDialog
        trigger={<Button variant="danger">Delete account</Button>}
        title="Delete your account?"
        description={
          'Your 12 private recipes will be deleted. Your 3 public recipes stay, credited to "a former member", so people who saved them keep them.'
        }
        confirmLabel="Delete account"
        onConfirm={() => undefined}
      />
    </div>
  </StyleguideSection>
);

export const EmptyStateSection = () => (
  <StyleguideSection title="Empty state" description="Says why it's empty and offers the way out.">
    <EmptyState icon={CookingPot} title="No recipes match" action={<Button variant="secondary">Clear filters</Button>}>
      Nothing is vegetarian, one-pot and under 30 minutes yet. Try removing a filter.
    </EmptyState>
  </StyleguideSection>
);
