const colourGroups = [
  {
    name: 'Core',
    tokens: [
      { token: 'ground', name: 'Ground', light: '#f3f5f8', dark: '#0d1424', use: 'Page background' },
      { token: 'surface', name: 'Surface', light: '#ffffff', dark: '#16203a', use: 'Cards, panels, fields' },
      { token: 'ink', name: 'Ink', light: '#14213a', dark: '#e8edf7', use: 'Text' },
      { token: 'muted', name: 'Muted', light: '#55617a', dark: '#9aa6bf', use: 'Secondary text' },
      {
        token: 'cobalt',
        name: 'Cobalt',
        light: '#1f4fd1',
        dark: '#8aa9ff',
        use: 'Actions, links, selected state, the recipe card rim'
      },
      { token: 'on-cobalt', name: 'On cobalt', light: '#ffffff', dark: '#0d1424', use: 'Text on cobalt' },
      { token: 'chip', name: 'Chip', light: '#e6ecf7', dark: '#1e2b4a', use: 'Quiet fills (stepper buttons, timer)' },
      {
        token: 'line',
        name: 'Line',
        light: '#d5dce8',
        dark: '#2a3654',
        use: 'Hairlines between rows and around panels'
      },
      {
        token: 'field',
        name: 'Field',
        light: '#7d8aa3',
        dark: '#66769a',
        use: 'Borders of fields, chips and checkboxes'
      },
      {
        token: 'yolk',
        name: 'Yolk',
        light: '#ffd84d',
        dark: '#ffd84d',
        use: 'Tags describing a recipe; things to check'
      },
      { token: 'on-yolk', name: 'On yolk', light: '#14213a', dark: '#14213a', use: 'Text on yolk' }
    ]
  },
  {
    name: 'Status',
    tokens: [
      { token: 'success', name: 'Success', light: '#1e7a46', dark: '#5fd18f', use: 'Status: done, saved' },
      { token: 'warning', name: 'Warning', light: '#7a5200', dark: '#ffd84d', use: 'Status: needs a look' },
      {
        token: 'danger',
        name: 'Danger',
        light: '#c2321f',
        dark: '#ff8a75',
        use: 'Status: errors, destructive actions'
      },
      { token: 'on-danger', name: 'On danger', light: '#ffffff', dark: '#0d1424', use: 'Text on danger' }
    ]
  }
];

const cuisines = [
  { slug: 'italian', name: 'Italian' },
  { slug: 'indian', name: 'Indian' },
  { slug: 'japanese', name: 'Japanese' },
  { slug: 'mexican', name: 'Mexican' },
  { slug: 'french', name: 'French' },
  { slug: 'other', name: 'Everything else' }
];

// Full class names, so Tailwind finds them in the source.
const typeRoles = [
  { name: 'Display XL 40/42', className: 'font-display text-display-xl', sample: 'Courgette and lemon orzo' },
  { name: 'Display L 32/35', className: 'font-display text-display-l', sample: "This week's plan" },
  { name: 'Display M 24/29', className: 'font-display text-display-m', sample: 'Shopping list' },
  { name: 'Title 18/23', className: 'font-display text-title', sample: 'Red lentil and spinach dal' },
  { name: 'Step 24/32', className: 'text-step', sample: 'Simmer for 12 minutes, stirring now and then.' },
  {
    name: 'Body 16/25',
    className: 'text-body',
    sample:
      'Grate the courgettes on the coarse side of the grater and squeeze out some of the water in a clean tea towel.'
  },
  {
    name: 'Small 14/21',
    className: 'text-small',
    sample: 'Adapted from the Wikibooks Cookbook (CC BY-SA 4.0): converted to metric, ingredients restructured.'
  },
  { name: 'Label 13/17', className: 'text-label', sample: 'Prep 10 min · Cook 25 min · Serves 4' }
];

const spacingSteps = [4, 8, 12, 16, 24, 32, 48];

const corners = [
  { label: 'Pill · controls', className: 'rounded-pill' },
  { label: '18 · cards', className: 'rounded-card' },
  { label: '14 · photos', className: 'rounded-photo' },
  { label: '12 · fields', className: 'rounded-field' }
];

export const ColourSection = () => (
  <section aria-labelledby="colour-heading" className="flex flex-col gap-4">
    <h2 id="colour-heading">Colour</h2>
    <p>
      Every pair used for text reaches at least 4.5:1 (WCAG 2.2, 1.4.3) in both themes; field borders reach 3:1 against
      their surface (1.4.11).
    </p>
    {colourGroups.map((group) => (
      <div key={group.name} className="flex flex-col gap-3">
        <h3>{group.name}</h3>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
          {group.tokens.map((colour) => (
            <li key={colour.token} className="grid overflow-hidden rounded-field border border-line bg-surface">
              <div className="h-14 border-b border-line" style={{ background: `var(--color-${colour.token})` }} />
              <div className="flex flex-col gap-0.5 px-3 py-2 text-small">
                <span className="font-bold">{colour.name}</span>
                <code className="text-muted">--color-{colour.token}</code>
                <span className="text-muted tabular-nums">
                  {colour.light} · {colour.dark}
                </span>
                <span className="text-muted">{colour.use}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ))}
    <div className="flex flex-col gap-3">
      <h3>Cuisine plates</h3>
      <ul className="grid grid-cols-3 gap-2">
        {cuisines.map((cuisine) => (
          <li key={cuisine.slug} className="flex flex-col gap-1 text-center text-small text-muted">
            <div className="aspect-4/3 rounded-photo" style={{ background: `var(--cuisine-${cuisine.slug})` }} />
            {cuisine.name}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export const TypeSection = () => (
  <section aria-labelledby="type-heading" className="flex flex-col gap-4">
    <h2 id="type-heading">Type</h2>
    <p>
      Bricolage Grotesque for headings and the wordmark, Atkinson Hyperlegible for everything you read and tap. Both are
      bundled with the app.
    </p>
    <ul className="flex flex-col rounded-card border border-line bg-surface">
      {typeRoles.map((role) => (
        <li key={role.name} className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0">
          <span className="text-small text-muted tabular-nums">{role.name}</span>
          <span className={role.className}>{role.sample}</span>
        </li>
      ))}
    </ul>
  </section>
);

export const ShapeSection = () => (
  <section aria-labelledby="shape-heading" className="flex flex-col gap-4">
    <h2 id="shape-heading">Space and shape</h2>
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <h3>Spacing</h3>
      <p className="text-small text-muted">A 4 px base; gaps between siblings, not margins.</p>
      <ul className="flex flex-col gap-1.5">
        {spacingSteps.map((step) => (
          <li
            key={step}
            className="grid grid-cols-[3.5rem_1fr] items-center gap-2.5 text-small text-muted tabular-nums"
          >
            {step} px
            <span className="block h-2.5 bg-cobalt" style={{ width: step * 2 }} />
          </li>
        ))}
      </ul>
    </div>
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <h3>Corners</h3>
      <p className="text-small text-muted">Round and sturdy, like enamelware.</p>
      <ul className="grid grid-cols-2 gap-2.5">
        {corners.map((corner) => (
          <li
            key={corner.label}
            className={`grid h-16 place-items-center border-2 border-field bg-chip text-small text-muted ${corner.className}`}
          >
            {corner.label}
          </li>
        ))}
      </ul>
    </div>
  </section>
);
