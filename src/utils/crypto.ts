import env from '../config/env';

const DEFAULT_SALT = 37;

function rotateRight(value: number, bits: number): number {
  return ((value >>> bits) | (value << (8 - bits))) & 0xff;
}

function rotateLeft(value: number, bits: number): number {
  return ((value << bits) | (value >>> (8 - bits))) & 0xff;
}

function getKeyCharCode(key: string, index: number): number {
  const normalized = index % key.length;
  return key.charCodeAt(normalized);
}

export function encryptText(plainText: string, key?: string): string {
  const secret = key ?? env.encryptionKey;

  if (!secret) {
    throw new Error('Encryption key is not configured.');
  }

  const chars: string[] = [];

  for (let i = 0; i < plainText.length; i++) {
    const textCode = plainText.charCodeAt(i);
    const keyCode = getKeyCharCode(secret, i);

    const xored = (textCode ^ keyCode) & 0xff;
    let rotated = rotateRight(xored, 3);
    rotated = (rotated ^ DEFAULT_SALT) & 0xff;

    chars.push(rotated.toString(16).padStart(2, '0').toUpperCase());
  }

  return chars.join('');
}

export function decryptText(cipherHex: string, key?: string): string {
  const secret = key ?? env.encryptionKey;

  if (!secret) {
    throw new Error('Encryption key is not configured.');
  }

  const output: string[] = [];

  for (let i = 0; i < cipherHex.length; i += 2) {
    const byteHex = cipherHex.slice(i, i + 2);
    if (byteHex.length < 2) {
      continue;
    }

    let byteValue = parseInt(byteHex, 16);
    if (Number.isNaN(byteValue)) {
      throw new Error('Invalid ciphertext');
    }

    byteValue = (byteValue ^ DEFAULT_SALT) & 0xff;
    const rotated = rotateLeft(byteValue, 3);
    const keyCode = getKeyCharCode(secret, output.length);
    const original = rotated ^ keyCode;
    output.push(String.fromCharCode(original));
  }

  return output.join('');
}

export default {
  encryptText,
  decryptText
};
