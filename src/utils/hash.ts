import crypto from 'crypto';

export const hash = (buffer: Buffer): string => {
  const hs = crypto.createHash('sha256');
  hs.update(buffer);
  return hs.digest('hex');
};
