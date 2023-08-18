import fs from 'fs';
import path from 'path';
import puppteer from 'puppeteer';

import { CONFIG } from '../config';
import { hash } from '../utils/hash';

export class DrawService {
  public async throwSomeone(avatar: string) {
    const page = await (await this.browser).newPage();
    await page.setViewport({ width: 512, height: 512 });
    await page.goto(`file://${path.resolve(process.cwd(), './templates/throw/index.html')}`);
    await page.evaluate(async (avatar: string) => {
      const img: HTMLImageElement = document.querySelector('#avatar')!;
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          resolve();
        };
        img.onerror = (e) => {
          reject(e);
        };
        img.setAttribute('src', avatar);
      });
    }, avatar);
    const buffer = await page.screenshot();
    const filename = `temp/${hash(buffer)}.jpg`;
    await fs.promises.writeFile(path.resolve(CONFIG.imageUrl, filename), buffer);
    await page.close();
    return `[CQ:image,file=${filename}]`;
  }

  public async punchSomeone(avatar: string) {
    const page = await (await this.browser).newPage();
    await page.setViewport({ width: 1000, height: 700 });
    await page.goto(`file://${path.resolve(process.cwd(), './templates/punch/index.html')}`);
    await page.evaluate(async (avatar: string) => {
      const imgs: HTMLImageElement[] = Array.from(document.querySelectorAll('.avatar'));
      await Promise.all(
        imgs.map((img) => {
          return new Promise<void>((resolve, reject) => {
            img.onload = () => {
              resolve();
            };
            img.onerror = (e) => {
              reject(e);
            };
            img.setAttribute('src', avatar);
          });
        }),
      );
    }, avatar);
    const buffer = await page.screenshot();
    const filename = `temp/${hash(buffer)}.jpg`;
    await fs.promises.writeFile(path.resolve(CONFIG.imageUrl, filename), buffer);
    await page.close();
    return `[CQ:image,file=${filename}]`;
  }

  private browser = puppteer.launch();
}

export const drawService = new DrawService();
