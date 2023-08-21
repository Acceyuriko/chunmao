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
    230: 785234597233,
    240: 2476355872442,
    250: 7206470004996,
    260: 18395464345546,
    270: 48761275100835,
    275: 81469790024659,
    280: 163757451934201,
    285: 407121730853746,
    290: 1126867205201262,
    295: 3255501490165483,
    // 300: 10099894121399145,
  };
  return settings[level] || 0;
};
