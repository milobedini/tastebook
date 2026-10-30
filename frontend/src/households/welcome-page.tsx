import { type FormEvent, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';

import { Banner, Button, ErrorWithRetry, Field, Input, Loading, Page, Squiggle } from '../dino';
import { NOT_A_NAME, useSaveName } from './name-api';
import { safeNextPath } from './safe-next-path';
import { useSession } from './session-api';

const NAME_MAX_LENGTH = 50;

// No action of its own: Continue is the retry.
const Unreachable = () => (
  <Banner tone="danger" title="Couldn't reach Tastebook">
    Check your connection and try again.
  </Banner>
);

const NameForm = () => {
  const saveName = useSaveName();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [isUnreachable, setIsUnreachable] = useState(false);

  const refuse = (message: string) => {
    setError(message);
    nameRef.current?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setIsUnreachable(false);
    const trimmed = name.trim();
    if (trimmed === '') {
      refuse(NOT_A_NAME);
      return;
    }
    try {
      const result = await saveName.mutateAsync(trimmed);
      if (result.kind === 'refused') {
        refuse(result.message);
      }
    } catch {
      setIsUnreachable(true);
      nameRef.current?.focus();
    }
  };

  return (
    <div className="flex max-w-100 flex-col gap-6">
      <h1>
        What’s your <Squiggle emphasis>name</Squiggle>?
      </h1>
      <p>It shows on recipes you write, like “by Milo”.</p>
      {isUnreachable && <Unreachable />}
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Field label="Your name" error={error}>
          {(control) => (
            <Input
              {...control}
              ref={nameRef}
              autoComplete="name"
              maxLength={NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-wrap items-start gap-2">
          <Button type="submit" loading={saveName.isPending} loadingLabel="Saving…">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

type WelcomeContentProps = { next: string };

const WelcomeContent = ({ next }: WelcomeContentProps) => {
  const { account, errorUpdatedAt, refetch } = useSession();
  if (account === null || (account !== undefined && account.name !== '')) {
    return <Navigate to={next} replace />;
  }
  if (account !== undefined) {
    return <NameForm />;
  }
  // A refetch resets a never-successful query to pending but leaves errorUpdatedAt, so the error stays up through its retry.
  if (errorUpdatedAt > 0) {
    return (
      <ErrorWithRetry title="Couldn't reach Tastebook" onRetry={refetch}>
        Check your connection and try again.
      </ErrorWithRetry>
    );
  }
  return <Loading>Checking your account…</Loading>;
};

export const WelcomePage = () => {
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  return (
    <Page>
      <title>Your name · Tastebook</title>
      <WelcomeContent next={next} />
    </Page>
  );
};
