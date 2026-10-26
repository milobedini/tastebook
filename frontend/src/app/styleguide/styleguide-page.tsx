import { ThemeSwitcher } from './theme-switcher';
import { ColourSection, ShapeSection, TypeSection } from './token-sections';

export const StyleguidePage = () => (
  <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
    <title>Style guide · Tastebook</title>
    <h1>Style guide</h1>
    <ThemeSwitcher />
    <ColourSection />
    <TypeSection />
    <ShapeSection />
  </main>
);
