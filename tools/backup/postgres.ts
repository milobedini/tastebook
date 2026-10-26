import { spawn } from 'node:child_process';

// Neon runs Postgres 18, so these need the client tools from 18 (or later) on the PATH.
const run = (command: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'inherit'] });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks).toString('utf8'));
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });

export const dumpDatabase = async (databaseUrl: string, file: string): Promise<void> => {
  await run('pg_dump', ['--format=custom', '--no-owner', '--no-acl', `--file=${file}`, `--dbname=${databaseUrl}`]);
};

// A dump that pg_restore can't read, or that holds no table data, would replace a good backup with a useless one.
export const checkDump = async (file: string): Promise<void> => {
  const contents = await run('pg_restore', ['--list', file]);
  if (!/ TABLE DATA /.test(contents)) {
    throw new Error(`${file} has no table data`);
  }
};

export const restoreDatabase = async (file: string, databaseUrl: string): Promise<void> => {
  await run('pg_restore', [
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-acl',
    '--single-transaction',
    '--exit-on-error',
    `--dbname=${databaseUrl}`,
    file
  ]);
};
