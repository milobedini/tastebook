import { Page } from '../../ui';
import { ConfirmSection, EmptyStateSection, FeedbackSection, RecipeCardsSection } from './content-sections';
import {
  ButtonsSection,
  FieldsSection,
  FiltersSection,
  ServingsSection,
  ShoppingListSection
} from './control-sections';
import { ThemeSwitcher } from './theme-switcher';
import { ColourSection, ShapeSection, TypeSection } from './token-sections';

export const StyleguidePage = () => (
  <Page>
    <title>Style guide · Tastebook</title>
    <h1>Style guide</h1>
    <ThemeSwitcher />
    <ColourSection />
    <TypeSection />
    <ShapeSection />
    <ButtonsSection />
    <FieldsSection />
    <FiltersSection />
    <ServingsSection />
    <ShoppingListSection />
    <RecipeCardsSection />
    <FeedbackSection />
    <ConfirmSection />
    <EmptyStateSection />
  </Page>
);
