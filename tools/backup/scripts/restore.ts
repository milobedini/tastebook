import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { get } from '@vercel/blob';

import { blobToken, latestDump, listDumps, requireEnv } from '../dumps.ts';
import { checkDump, restoreDatabase } from '../postgres.ts';

const targetUrl = requireEnv('TARGET_DATABASE_URL');
const token = blobToken();
const requested = process.argv[2];
const name = requested ?? latestDump(await listDumps(token))?.pathname;
if (name === undefined) {
  throw new Error('There are no dumps in the store');
}

const result = await get(name, { access: 'private', token, useCache: false });
if (result === null || result.statusCode !== 200) {
  throw new Error(`There is no dump named ${name}`);
}

const directory = await mkdtemp(join(tmpdir(), 'tastebook-restore-'));
try {
  const file = join(directory, 'restore.dump');
  await pipeline(Readable.fromWeb(result.stream), createWriteStream(file));
  await checkDump(file);
  console.log(`Restoring ${name}`);
  await restoreDatabase(file, targetUrl);
  console.log(`Restored ${name}`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
