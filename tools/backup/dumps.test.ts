import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dumpName, expiredDumps, latestDump } from './dumps.ts';

const now = new Date('2026-10-26T02:17:00.000Z');

describe('dumpName', () => {
  it('names a dump by the time it was taken, without colons', () => {
    assert.equal(dumpName(new Date('2026-10-26T02:17:05.123Z')), 'tastebook-2026-10-26T021705Z.dump');
  });
});

describe('expiredDumps', () => {
  const cases: [string, string, boolean][] = [
    ['taken just now', '2026-10-26T02:16:00.000Z', false],
    ['29 days old', '2026-09-27T02:17:00.000Z', false],
    ['exactly 30 days old', '2026-09-26T02:17:00.000Z', false],
    ['a minute over 30 days old', '2026-09-26T02:16:00.000Z', true],
    ['a year old', '2025-10-26T02:17:00.000Z', true]
  ];

  for (const [label, uploadedAt, expired] of cases) {
    it(`${expired ? 'deletes' : 'keeps'} a dump ${label}`, () => {
      const dump = { pathname: 'tastebook-dump.dump', uploadedAt: new Date(uploadedAt) };
      assert.deepEqual(expiredDumps([dump], now), expired ? [dump] : []);
    });
  }
});

describe('latestDump', () => {
  it('picks the most recently uploaded dump, whatever the order', () => {
    const dumps = [
      { pathname: 'tastebook-2026-10-24T021700Z.dump', uploadedAt: new Date('2026-10-24T02:17:00.000Z') },
      { pathname: 'tastebook-2026-10-26T021700Z.dump', uploadedAt: new Date('2026-10-26T02:17:00.000Z') },
      { pathname: 'tastebook-2026-10-25T021700Z.dump', uploadedAt: new Date('2026-10-25T02:17:00.000Z') }
    ];
    assert.equal(latestDump(dumps)?.pathname, 'tastebook-2026-10-26T021700Z.dump');
  });

  it('finds nothing in an empty store', () => {
    assert.equal(latestDump([]), undefined);
  });
});
