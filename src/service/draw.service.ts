import fs from 'fs';
import { meanBy } from 'lodash';
import path from 'path';
import puppteer from 'puppeteer';

import { CONFIG } from '../config';
import { getNextExp, getNextLevel, hash } from '../utils';
import { UserDetail } from '../utils/types';

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

  public async drawLegion(detail: UserDetail) {
    const page = await (await this.browser).newPage();
    await page.setViewport({ width: 1102, height: 674 });
    await page.goto(`file://${path.resolve(process.cwd(), './templates/legion/index.html')}`);

    const gd = (detail.GraphData || []).sort(
      (a, b) => new Date(b.DateLabel).valueOf() - new Date(a.DateLabel).valueOf(),
    );
    let lastDayExp = 0;
    let lastWeekExpPerDay = 0;
    if (gd.length > 0) {
      lastDayExp = gd[1]?.EXPDifference || 0;
      lastWeekExpPerDay = meanBy(gd.slice(1, 8), 'EXPDifference');
    }
    const nextLevel = getNextLevel(detail.Level);
    const nextExp = getNextExp(nextLevel) - (gd[0]?.TotalOverallEXP || 0);

    const params = {
      name: detail.Name,
      src: detail.CharacterImageURL,
      line1: `服务器: ${detail.Server}`,
      line2: `等级: ${detail.Level} - ${detail.EXPPercent}% (排名${detail.ServerRank})`,
      line3: `职业: ${detail.Class} (排名${detail.ClassRank})`,
      line4: detail.LegionCoinsPerDay
        ? `联盟等级: ${detail.LegionLevel} (排名${detail.LegionRank})`
        : `非联盟最高角色，无法查询联盟信息`,
      line5: detail.LegionCoinsPerDay ? `联盟战斗力: ${detail.LegionPower} (每天${detail.LegionCoinsPerDay}币)` : '',
      line6: `昨天exp: ${this.formatExp(lastDayExp)}, 7天平均exp: ${this.formatExp(lastWeekExpPerDay)}`,
      line7: `按照最近1天的进度，还需要${lastDayExp ? (nextExp / lastDayExp).toFixed(1) : '∞'}天到达${nextLevel}级`,
      line8: `按照最近7天的进度，还需要${
        lastWeekExpPerDay ? (nextExp / lastWeekExpPerDay).toFixed(1) : '∞'
      }天到达${nextLevel}级`,
    };

    await page.evaluate(async (params) => {
      const img: HTMLImageElement = document.querySelector('.right > img')!;

      document.querySelector('.line.line1')!.textContent = params.line1;
      document.querySelector('.line.line2')!.textContent = params.line2;
      document.querySelector('.line.line3')!.textContent = params.line3;
      document.querySelector('.line.line4')!.textContent = params.line4;
      document.querySelector('.line.line5')!.textContent = params.line5;
      document.querySelector('.line.line6')!.textContent = params.line6;
      document.querySelector('.line.line7')!.textContent = params.line7;
      document.querySelector('.line.line8')!.textContent = params.line8;
      document.querySelector('.right .name')!.textContent = params.name;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          resolve();
        };
        img.onerror = (e) => {
          reject(e);
        };
        img.setAttribute('src', params.src);
      });
    }, params);

    const buffer = await page.screenshot();
    const filename = `temp/legion-${detail.Name}.jpg`;
    await fs.promises.writeFile(path.resolve(CONFIG.imageUrl, filename), buffer);
    await page.close();
    return `[CQ:image,file=${filename}]`;
  }

  private formatExp(exp: number) {
    if (isNaN(exp)) {
      return '0';
    }
    if (exp < 1000) {
      return exp.toString();
    }
    let temp = exp / 1000;
    if (temp < 1000) {
      return `${temp.toFixed(1)}K`;
    }
    temp = temp / 1000;
    if (temp < 1000) {
      return `${temp.toFixed(1)}M`;
    }
    temp = temp / 1000;
    if (temp < 1000) {
      return `${temp.toFixed(1)}B`;
    }
    temp = temp / 1000;
    return `${temp.toFixed(1)}T`;
  }

  private browser = puppteer.launch();
}

export const drawService = new DrawService();
