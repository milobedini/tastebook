import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { components } from '../api/schema';
import { toast } from '../dino';
import { renderRoute } from '../test/render-route';
import { server } from '../test/server';

type CurrentAccount = components['schemas']['CurrentAccount'];
type Household = components['schemas']['Household'];
type PatchedHouseholdChanges = components['schemas']['PatchedHouseholdChanges'];

const HOUSEHOLD = '/api/household/';

const answerSignedIn = () =>
  server.use(
    http.get('/api/account/', () =>
      HttpResponse.json<CurrentAccount>({
        account: { email: 'sam@example.com', name: 'Milo', unit_system: 'metric' }
      })
    )
  );

type Rename = { body: PatchedHouseholdChanges; csrfToken: string | null };

// Milo's household with Ann in it, until a PATCH renames it; records each PATCH in the order it arrives.
const answerHousehold = () => {
  const renames: Rename[] = [];
  const state: { household: Household } = {
    household: {
      name: "Milo's household",
      members: [
        { id: 1, name: 'Milo', is_you: true },
        { id: 2, name: 'Ann', is_you: false }
      ]
    }
  };
  server.use(
    http.get(HOUSEHOLD, () => HttpResponse.json<Household>(state.household)),
    http.patch(HOUSEHOLD, async ({ request }) => {
      const body = (await request.json()) as PatchedHouseholdChanges;
      renames.push({ body, csrfToken: request.headers.get('X-CSRFToken') });
      state.household = { ...state.household, name: body.name ?? state.household.name };
      return HttpResponse.json<Household>(state.household);
    })
  );
  return renames;
};

const nameField = () => screen.getByRole('textbox', { name: 'Household name' });

const saveName = async (name: string) => {
  await userEvent.clear(await screen.findByRole('textbox', { name: 'Household name' }));
  if (name !== '') {
    await userEvent.type(nameField(), name);
  }
  await userEvent.click(screen.getByRole('button', { name: 'Save name' }));
};

describe('HouseholdPage', () => {
  beforeEach(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: Django's account request sets this cookie; jsdom has no Cookie Store
    document.cookie = 'csrftoken=abc';
  });

  // Sonner keeps its toasts outside React, so one test's toast would still show in the next.
  afterEach(() => {
    toast.dismiss();
  });

  it("shows the household's name and its members, you first", async () => {
    answerSignedIn();
    answerHousehold();
    renderRoute('/household');

    expect(await screen.findByRole('heading', { level: 1, name: 'Your household' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Your household · Tastebook'));
    expect(nameField()).toHaveValue("Milo's household");
    expect(nameField()).toHaveAccessibleDescription('Everyone in the household sees it.');
    const members = within(screen.getByRole('list', { name: 'Members' })).getAllByRole('listitem');
    // The avatar's letter comes first but is hidden from screen readers.
    expect(members).toHaveLength(2);
    expect(members[0]).toHaveTextContent(/^M ?Milo \(you\)$/);
    expect(members[1]).toHaveTextContent(/^A ?Ann$/);
  });

  it('shows that it is getting the household, then the household', async () => {
    answerSignedIn();
    const gate = { release: () => {} };
    const released = new Promise<void>((resolve) => {
      gate.release = resolve;
    });
    server.use(
      http.get(HOUSEHOLD, async () => {
        await released;
        return HttpResponse.json<Household>({
          name: "Milo's household",
          members: [{ id: 1, name: 'Milo', is_you: true }]
        });
      })
    );
    renderRoute('/household');

    expect(await screen.findByText('Getting your household…')).toBeInTheDocument();

    gate.release();

    expect(await screen.findByRole('textbox', { name: 'Household name' })).toHaveValue("Milo's household");
  });

  it('saves a new name trimmed and says so', async () => {
    answerSignedIn();
    const renames = answerHousehold();
    renderRoute('/household');

    await saveName('  The Bedinis ');

    expect(await screen.findByText('Household name saved')).toBeInTheDocument();
    expect(renames).toEqual([{ body: { name: 'The Bedinis' }, csrfToken: 'abc' }]);
    expect(nameField()).toHaveValue('The Bedinis');
  });

  it.each([
    ['empty', ''],
    ['only spaces', '   ']
  ])('says how to fix a name that is %s, and sends nothing', async (_, name) => {
    answerSignedIn();
    const renames = answerHousehold();
    renderRoute('/household');

    await saveName(name);

    expect(nameField()).toHaveAccessibleDescription('Enter a name for your household, like The Bedinis.');
    expect(nameField()).toHaveFocus();
    expect(renames).toEqual([]);
  });

  it("shows the server's message for a name it refuses", async () => {
    answerSignedIn();
    answerHousehold();
    const refused = 'Ensure this field has no more than 100 characters.';
    server.use(http.patch(HOUSEHOLD, () => HttpResponse.json({ name: [refused] }, { status: 400 })));
    renderRoute('/household');

    await saveName('The Bedinis');

    await waitFor(() => expect(nameField()).toHaveAccessibleDescription(refused));
    expect(nameField()).toHaveFocus();
  });

  it.each([
    ['the server fails', () => new HttpResponse(null, { status: 500 })],
    ['the network fails', () => HttpResponse.error()]
  ])("says the name couldn't be saved and keeps it when %s", async (_, answer) => {
    answerSignedIn();
    answerHousehold();
    server.use(http.patch(HOUSEHOLD, answer));
    renderRoute('/household');

    await saveName('The Bedinis');

    expect(
      await screen.findByText("Couldn't save the household's name. Check your connection and try again.")
    ).toBeInTheDocument();
    expect(nameField()).toHaveValue('The Bedinis');
  });

  it("says the household couldn't be loaded, and tries again", async () => {
    answerSignedIn();
    server.use(http.get(HOUSEHOLD, () => new HttpResponse(null, { status: 500 })));
    renderRoute('/household');

    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent("Couldn't load your household");
    expect(failed).toHaveTextContent('Check your connection and try again.');

    answerHousehold();
    await userEvent.click(within(failed).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('textbox', { name: 'Household name' })).toHaveValue("Milo's household");
  });

  it('sends a visitor to sign in, and back here after, without asking for a household', async () => {
    const asked = { count: 0 };
    server.use(
      http.get(HOUSEHOLD, () => {
        asked.count += 1;
        return new HttpResponse(null, { status: 403 });
      })
    );
    const { router, queryClient } = renderRoute('/household');

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname + router.state.location.search).toBe('/sign-in?next=%2Fhousehold');
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(asked.count).toBe(0);
  });
});
