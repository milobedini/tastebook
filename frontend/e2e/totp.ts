import { createHmac } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const fromBase32 = (key: string): Buffer => {
  const bits = [...key.replace(/=+$/, '').toUpperCase()]
    .map((character) => BASE32.indexOf(character).toString(2).padStart(5, '0'))
    .join('');
  const bytes = bits.match(/.{8}/g) ?? [];
  return Buffer.from(bytes.map((byte) => Number.parseInt(byte, 2)));
};

// The 6-digit code an authenticator app shows for this key at this moment (RFC 6238: HMAC-SHA1, 30-second steps).
export const totpCode = (key: string, at = Date.now()): string => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const hmac = createHmac('sha1', fromBase32(key)).update(counter).digest();
  const offset = (hmac.at(-1) ?? 0) & 0x0f;
  return String(hmac.readUInt32BE(offset) & 0x7fffffff)
    .slice(-6)
    .padStart(6, '0');
};
