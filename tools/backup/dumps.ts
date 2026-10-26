import type { ListBlobResultBlob } from '@vercel/blob';
import { list } from '@vercel/blob';

export const RETENTION_DAYS = 30;

const DUMP_PREFIX = 'tastebook-';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type Dump = Pick<ListBlobResultBlob, 'pathname' | 'uploadedAt'>;

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

export const blobToken = (): string => requireEnv('BACKUP_BLOB_READ_WRITE_TOKEN');

// Colons are left out so the name is safe as a file name; it still sorts by time.
export const dumpName = (takenAt: Date): string =>
  `${DUMP_PREFIX}${takenAt
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replaceAll(':', '')}.dump`;

export const listDumps = async (token: string, cursor?: string): Promise<ListBlobResultBlob[]> => {
  const page = await list({ prefix: DUMP_PREFIX, token, cursor });
  return page.hasMore && page.cursor ? [...page.blobs, ...(await listDumps(token, page.cursor))] : page.blobs;
};

export const expiredDumps = <T extends Dump>(dumps: T[], now: Date): T[] =>
  dumps.filter((dump) => now.getTime() - dump.uploadedAt.getTime() > RETENTION_DAYS * DAY_IN_MS);

export const latestDump = <T extends Dump>(dumps: T[]): T | undefined =>
  dumps.reduce<T | undefined>(
    (latest, dump) => (latest === undefined || dump.uploadedAt > latest.uploadedAt ? dump : latest),
    undefined
  );
