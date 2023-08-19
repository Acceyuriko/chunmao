import crypto from 'crypto';

export const hash = (buffer: Buffer): string => {
  const hs = crypto.createHash('sha256');
  hs.update(buffer);
  return hs.digest('hex');
};

export const getNextLevel = (level: number) => {
  const settings = [220, 230, 240, 250, 260, 270, 275, 280, 285, 290, 295, 300];
  return settings.find((i) => i > level)!;
};

export const getNextExp = (level: number) => {
  const settings: Record<number, number> = {
    220: 226834057694,
    230: 888805728115,
    240: 2780379685705,
    250: 7764453421743,
    260: 19276710581130,
    270: 48761275100835,
    275: 82351036260243,
    280: 164638698169785,
    285: 408002977089330,
    290: 1127748451436850,
    295: 3256382736401070,
    300: 10100775367634700,
  };
  return settings[level] || 0;
};
