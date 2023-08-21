import dayjs from 'dayjs';
import { groupBy, keyBy, maxBy } from 'lodash';

import { RereadMsg, RereadUser } from '../db';
import { logger } from '../utils/logger';
import { cqService } from './cq.service';

export class TaskService {
  public run() {
    this.scheduleRereadWeekly();
  }

  public async generateRereadWeekly() {
    const messageGroup = groupBy(await RereadMsg.findAll(), 'groupId');
    const userGroup = groupBy(await RereadUser.findAll(), 'groupId');
    const result: { groupId: number; text: string }[] = [];
    for (const group of Object.keys(messageGroup)) {
      const messages = messageGroup[group] || [];
      const max = maxBy(messages, 'count');
      if (!max) {
        result.push({ groupId: parseInt(group), text: 'owo, 本群没有复读机' });
        continue;
      }
      const members = keyBy(await cqService.listMember(group), 'user_id');
      const getName = (userId: number | string) => {
        return members[userId]?.card || members[userId]?.nickname;
      };
      const users = userGroup[group] || [];
      const [first, second, third] = users.sort((a, b) => b.count - a.count);
      result.push({
        groupId: parseInt(group),
        text:
          `本周最长的复读长袭是：\n` +
          `${max.content}\n` +
          `此金句出自——${getName(max.creator)}\n` +
          `当时被复读机们连续复读了${max.count}次!\n` +
          `————————————————————————\n` +
          `本周最佳复读机的称号授予${getName(first.userId)}!\n` +
          `他在过去的一周里疯狂复读${first.count}次！简直太丧病了。\n` +
          `此外，以下两名成员获得了亚军和季军，也是非常优秀的复读机：\n` +
          (second ? `${getName(second.userId)} 复读次数：${second.count}\n` : '虚位以待\n') +
          (third ? `${getName(third.userId)} 复读次数：${third.count}\n` : '虚位以待\n') +
          '为了成为最佳复读机，努力复读吧！uwu',
      });
    }
    return result;
  }

  private scheduleRereadWeekly() {
    setTimeout(() => {
      this.generateRereadWeekly()
        .then(async (result) => {
          await Promise.all(result.map((i) => cqService.sendGroupMessage(i.groupId, i.text)));
          // await RereadMsg.destroy();
          // await RereadUser.destroy();
        })
        .catch((e) => {
          logger.error(`failed to scheduleRereadWeekly. ${(e as Error).stack || JSON.stringify(e)}`);
        })
        .finally(() => {
          this.scheduleRereadWeekly();
        });
    }, dayjs().endOf('week').valueOf() - Date.now());
  }
}

export const taskService = new TaskService();
