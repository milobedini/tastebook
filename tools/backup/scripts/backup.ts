import { openAsBlob } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { del, put } from '@vercel/blob';

import { blobToken, dumpName, expiredDumps, listDumps, RETENTION_DAYS, requireEnv } from '../dumps.ts';
import { checkDump, dumpDatabase } from '../postgres.ts';

const databaseUrl = requireEnv('PRODUCTION_DATABASE_URL');
const token = blobToken();
const now = new Date();
const name = dumpName(now);
const directory = await mkdtemp(join(tmpdir(), 'tastebook-backup-'));

try {
  const file = join(directory, name);
  await dumpDatabase(databaseUrl, file);
  await checkDump(file);
  const uploaded = await put(name, await openAsBlob(file), {
    access: 'private',
    token,
    multipart: true,
    contentType: 'application/octet-stream'
  });
  console.log(`Uploaded ${uploaded.pathname}`);

  // Pruning only after a successful upload means a failing night never shortens the history.
  const expired = expiredDumps(await listDumps(token), now);
  if (expired.length > 0) {
    await del(
      expired.map((dump) => dump.url),
      { token }
    );
  }
  console.log(`Deleted ${expired.length} dumps older than ${RETENTION_DAYS} days`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
