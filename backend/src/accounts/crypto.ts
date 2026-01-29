import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

function decodeKey(): Buffer {
  const raw = process.env.ACCOUNT_CREDENTIALS_KEY;
  if (!raw) {
    throw new Error('ACCOUNT_CREDENTIALS_KEY not set');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('ACCOUNT_CREDENTIALS_KEY must be 32 bytes (base64)');
  }
  return key;
}

export interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

export function encryptPayload(input: object): EncryptedPayload {
  const key = decodeKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const json = JSON.stringify(input);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
}

export function decryptPayload<T>(payload: EncryptedPayload): T {
  const key = decodeKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}
