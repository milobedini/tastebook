import { type FormEvent, type RefObject, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Navigate, useNavigate, useSearchParams } from 'react-router';

import { Banner, Button, Field, Input, Page } from '../dino';
import type { CodeFlow } from './auth-api';
import { safeNextPath } from './safe-next-path';
import { useSession } from './session-api';
import { useConfirmCode, useGoogleSignIn, useRequestCode } from './sign-in-api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

const NOT_AN_ADDRESS = 'Enter your email address, like sam@example.com.';
const NOT_A_CODE = 'Enter the 6-digit code from the email, like 123456.';
const WRONG_CODE = "That code isn't right. Check the email and try again.";
const STOPPED = 'That code has stopped working. Use a different email or send a new code from step 1.';

const minutes = (seconds: number): string => {
  const count = Math.ceil(seconds / 60);
  return count === 1 ? '1 minute' : `${count} minutes`;
};

const tooManyCodes = (retryAfterSeconds: number | undefined): string =>
  `You've asked for too many codes. Try again in ${retryAfterSeconds === undefined ? 'a few minutes' : minutes(retryAfterSeconds)}.`;

// No action of its own: the form's main button is the retry.
const Unreachable = () => (
  <Banner tone="danger" title="Couldn't reach Tastebook">
    Check your connection and try again.
  </Banner>
);

// allauth sends someone back from Google with ?error= when signing in there didn't work, cancelled included.
const GoogleRefused = () => (
  <Banner tone="danger" title="Couldn't sign in with Google">
    Try again, or use an email code instead.
  </Banner>
);

const actions = 'flex flex-wrap items-start gap-2';

type EmailStepProps = {
  email: string;
  onEmailChange: (email: string) => void;
  emailRef: RefObject<HTMLInputElement | null>;
  onCodeSent: (email: string, flow: CodeFlow) => void;
  next: string;
  isGoogleRefused: boolean;
  onDismissGoogleRefused: () => void;
};

const EmailStep = ({
  email,
  onEmailChange,
  emailRef,
  onCodeSent,
  next,
  isGoogleRefused,
  onDismissGoogleRefused
}: EmailStepProps) => {
  const requestCode = useRequestCode();
  const google = useGoogleSignIn();
  const [error, setError] = useState<string>();
  const [isUnreachable, setIsUnreachable] = useState(false);

  const refuse = (message: string) => {
    setError(message);
    emailRef.current?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setIsUnreachable(false);
    onDismissGoogleRefused();
    google.reset();
    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      refuse(NOT_AN_ADDRESS);
      return;
    }
    try {
      const result = await requestCode.mutateAsync(address);
      if (result.kind === 'code-sent') {
        onCodeSent(address, result.flow);
        return;
      }
      if (result.kind === 'limited') {
        refuse(tooManyCodes(result.retryAfterSeconds));
        return;
      }
      refuse(result.errors[0]?.message ?? NOT_AN_ADDRESS);
    } catch {
      setIsUnreachable(true);
    }
  };

  const goToGoogle = () => {
    setIsUnreachable(false);
    onDismissGoogleRefused();
    google.goToGoogle(`/sign-in?next=${encodeURIComponent(next)}`);
  };

  return (
    <>
      <h1>Sign in</h1>
      <p>We'll email you a 6-digit code. New to Tastebook? The same code makes your account.</p>
      {(isUnreachable || google.isUnreachable) && <Unreachable />}
      {isGoogleRefused && <GoogleRefused />}
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Field label="Email address" error={error}>
          {(control) => (
            <Input
              {...control}
              ref={emailRef}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          )}
        </Field>
        <div className={actions}>
          <Button type="submit" loading={requestCode.isPending} loadingLabel="Sending…">
            Send code
          </Button>
        </div>
      </form>
      {google.isOffered && (
        <div className={actions}>
          <Button variant="secondary" loading={google.isGoing} loadingLabel="Going to Google…" onClick={goToGoogle}>
            Continue with Google
          </Button>
        </div>
      )}
    </>
  );
};

type CodeStepProps = {
  email: string;
  flow: CodeFlow;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSignedIn: () => void;
  onDifferentEmail: () => void;
};

const CodeStep = ({ email, flow, headingRef, onSignedIn, onDifferentEmail }: CodeStepProps) => {
  const confirmCode = useConfirmCode();
  const codeRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [isUnreachable, setIsUnreachable] = useState(false);

  const refuse = (message: string) => {
    setError(message);
    codeRef.current?.focus();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setIsUnreachable(false);
    if (!CODE_PATTERN.test(code)) {
      refuse(NOT_A_CODE);
      return;
    }
    try {
      const result = await confirmCode.mutateAsync({ flow, code });
      if (result.kind === 'signed-in') {
        onSignedIn();
        return;
      }
      if (result.status === 409) {
        refuse(STOPPED);
        return;
      }
      refuse(result.errors[0]?.code === 'incorrect_code' ? WRONG_CODE : (result.errors[0]?.message ?? WRONG_CODE));
    } catch {
      setIsUnreachable(true);
    }
  };

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Check your email
      </h1>
      <p>
        We sent a 6-digit code to <span className="font-extrabold [overflow-wrap:anywhere]">{email}</span>. It works for
        10 minutes.
      </p>
      {isUnreachable && <Unreachable />}
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Field label="Code" error={error}>
          {(control) => (
            <Input
              {...control}
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          )}
        </Field>
        <div className={actions}>
          <Button type="submit" loading={confirmCode.isPending} loadingLabel="Signing in…">
            Sign in
          </Button>
          <Button variant="secondary" onClick={onDifferentEmail}>
            Use a different email
          </Button>
        </div>
      </form>
    </>
  );
};

type SentCode = { email: string; flow: CodeFlow };

export const SignInPage = () => {
  const { account } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState('');
  const [sentCode, setSentCode] = useState<SentCode>();
  const next = safeNextPath(searchParams.get('next'));

  if (account) {
    return <Navigate to={next} replace />;
  }

  // Focus follows the step, so a screen reader reads the new heading and the address the code went to.
  const showCodeStep = (sentTo: string, flow: CodeFlow) => {
    flushSync(() => setSentCode({ email: sentTo, flow }));
    headingRef.current?.focus();
  };

  const dismissGoogleRefused = () => {
    if (searchParams.has('error')) {
      setSearchParams({ next }, { replace: true });
    }
  };

  const showEmailStep = () => {
    flushSync(() => setSentCode(undefined));
    emailRef.current?.focus();
  };

  return (
    <Page>
      <title>Sign in · Tastebook</title>
      <div className="flex max-w-100 flex-col gap-6">
        {sentCode === undefined ? (
          <EmailStep
            email={email}
            onEmailChange={setEmail}
            emailRef={emailRef}
            onCodeSent={showCodeStep}
            next={next}
            isGoogleRefused={searchParams.has('error')}
            onDismissGoogleRefused={dismissGoogleRefused}
          />
        ) : (
          <CodeStep
            email={sentCode.email}
            flow={sentCode.flow}
            headingRef={headingRef}
            onSignedIn={() => void navigate(next, { replace: true })}
            onDifferentEmail={showEmailStep}
          />
        )}
      </div>
    </Page>
  );
};
