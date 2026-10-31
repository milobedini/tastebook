import { type FormEvent, useRef, useState } from 'react';
import { Navigate } from 'react-router';

import { Avatar, Button, ErrorWithRetry, Field, Input, Loading, Page, Squiggle, toast } from '../dino';
import {
  HOUSEHOLD_NAME_MAX_LENGTH,
  type Household,
  NOT_A_HOUSEHOLD_NAME,
  useHousehold,
  useRenameHousehold
} from './household-api';
import { useSession } from './session-api';

const HouseholdNameForm = ({ name: savedName }: { name: string }) => {
  const renameHousehold = useRenameHousehold();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(savedName);
  const [error, setError] = useState<string>();

  const refuse = (message: string) => {
    setError(message);
    nameRef.current?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    const trimmed = name.trim();
    if (trimmed === '') {
      refuse(NOT_A_HOUSEHOLD_NAME);
      return;
    }
    try {
      const result = await renameHousehold.mutateAsync(trimmed);
      if (result.kind === 'refused') {
        refuse(result.message);
        return;
      }
      setName(result.household.name);
      toast.success('Household name saved');
    } catch {
      toast.error("Couldn't save the household's name. Check your connection and try again.");
    }
  };

  return (
    <section aria-labelledby="household-name" className="flex flex-col gap-4">
      <h2 id="household-name">Name</h2>
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Household name" help="Everyone in the household sees it." error={error}>
          {(control) => (
            <Input
              {...control}
              ref={nameRef}
              autoComplete="off"
              maxLength={HOUSEHOLD_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-wrap items-start gap-2">
          <Button type="submit" loading={renameHousehold.isPending} loadingLabel="Saving…">
            Save name
          </Button>
        </div>
      </form>
    </section>
  );
};

const Members = ({ members }: { members: Household['members'] }) => (
  <section aria-labelledby="household-members" className="flex flex-col gap-4">
    <h2 id="household-members">Members</h2>
    <ul aria-labelledby="household-members" className="flex flex-col">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex min-h-14 items-center gap-3 border-line border-t py-1.5 text-body wrap-anywhere first:border-t-0"
        >
          <Avatar name={member.name} />
          <span>
            {member.name}
            {member.is_you ? <span className="text-muted"> (you)</span> : null}
          </span>
        </li>
      ))}
    </ul>
  </section>
);

const HouseholdSettings = ({ household }: { household: Household }) => (
  <div className="flex max-w-100 flex-col gap-8">
    <h1>
      Your <Squiggle emphasis>household</Squiggle>
    </h1>
    <HouseholdNameForm name={household.name} />
    <Members members={household.members} />
  </div>
);

// Only rendered once someone is signed in, so a visitor never asks for a household.
const HouseholdDetails = () => {
  const { household, errorUpdatedAt, refetch } = useHousehold();
  if (household !== undefined) {
    return <HouseholdSettings household={household} />;
  }
  // As on the account page: errorUpdatedAt survives the retry's reset to pending, so the error stays up through it.
  if (errorUpdatedAt > 0) {
    return (
      <ErrorWithRetry title="Couldn't load your household" onRetry={refetch}>
        Check your connection and try again.
      </ErrorWithRetry>
    );
  }
  return <Loading>Getting your household…</Loading>;
};

const HouseholdContent = () => {
  const { account, errorUpdatedAt, refetch } = useSession();
  if (account === null) {
    return <Navigate to="/sign-in?next=%2Fhousehold" replace />;
  }
  if (account !== undefined) {
    return <HouseholdDetails />;
  }
  if (errorUpdatedAt > 0) {
    return (
      <ErrorWithRetry title="Couldn't reach Tastebook" onRetry={refetch}>
        Check your connection and try again.
      </ErrorWithRetry>
    );
  }
  return <Loading>Checking your account…</Loading>;
};

export const HouseholdPage = () => (
  <Page>
    <title>Your household · Tastebook</title>
    <HouseholdContent />
  </Page>
);
