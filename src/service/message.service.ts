import axios, { AxiosError } from 'axios';
import leven from 'fast-levenshtein';
import fs from 'fs';
import { difference, uniq } from 'lodash';
import path from 'path';
import { Op } from 'sequelize';

import { CONFIG } from '../config';
import { Car, db, Msg, MsgNoPrefix, RankInfo, RereadMsg, RereadUser } from '../db';
import { STAR_FORCE_AFTER_16 } from '../utils/constant';
import { logger } from '../utils/logger';
import { Message, UserDetail } from '../utils/types';
import { drawService } from './draw.service';
import { taskService } from './task.service';

export class MessageService {
  public async handle(message: Message): Promise<string> {
    // if (!CONFIG.groupId.includes(message.group_id)) {
    //   return '';
    // }

    if (this.recentMessage.includes(message.message_id)) {
      logger.info(`repeated message, id: ${message.message_id}`);
      return '';
    }
    this.recentMessage.push(message.message_id);
    if (this.recentMessage.length > 1024) {
      this.recentMessage.shift();
    }

    logger.info(`receive message: ${JSON.stringify(message)}`);

    if (message.post_type === 'notice' && message.notice_type === 'group_increase') {
      return this.onWelcome(message);
    }
    if (message.post_type === 'message' && ['normal', 'friend'].includes(message.sub_type)) {
      if (CONFIG.botId === message.user_id || CONFIG.blacklist.includes(message.user_id)) {
        // 过滤自己的消息和黑名单的消息
        logger.info(`filtered message, id: ${message.message_id}`);
        return '';
      }
      try {
        return await this.onMessage(message);
      } catch (e) {
        logger.error(`failed to onMessage, ${(e as Error).stack || JSON.stringify(e)}`);
        return 'w(ﾟДﾟ)w 出现了一个意料之外的错误，快去找主人';
      }
    }
    return '';
  }

  private async onMessage(message: Message): Promise<string> {
    if (message.raw_message.startsWith(CONFIG.botName)) {
      message.raw_message = message.raw_message.replace(CONFIG.botName, '');
      return this.onNameMessage(message);
    }
    if (message.raw_message.startsWith(`[CQ:at,qq=${CONFIG.botId}]`)) {
      message.raw_message = message.raw_message.replace(`[CQ:at,qq=${CONFIG.botId}]`, '');
      return this.onNameMessage(message);
    }
    if (message.raw_message.startsWith('联盟查询')) {
      return this.onLegionQuery(message);
    }
    if (message.raw_message.startsWith('查询绑定')) {
      return this.onQueryBind(message);
    }
    return (await this.onMsgNoPrefix(message)) || (await this.onReread(message));
  }

  private async onWelcome(message: Message): Promise<string> {
    if (message.sub_type !== 'approve') {
      return '';
    }
    const questions = await Msg.findAll({ where: { question: '固定回复welcome' } });
    return questions[Math.floor(Math.random() * questions.length)].answer;
  }

  private async onNameMessage(message: Message): Promise<string> {
    if (message.raw_message.trim() === '') {
      return '(ﾉﾟ▽ﾟ)ﾉ我在哦~';
    }
    if (message.raw_message.replaceAll(CONFIG.botName, '').trim() === '') {
      let msg = message.raw_message.replace(CONFIG.botName, '').trim();
      if (msg === '') {
        return '禁止套娃';
      }
      msg = msg.replace(CONFIG.botName, '').trim();
      if (msg === '') {
        return '禁止双重套娃';
      }
      msg = msg.replace(CONFIG.botName, '').trim();
      if (msg === '') {
        return '禁止三重套娃';
      }
      return `${CONFIG.botName.slice(0, 1)}nm`;
    }
    if (/^学习.*?问.*?答/.test(message.raw_message)) {
      return this.onLearnQuestion(message);
    }
    if (message.raw_message.startsWith(`查询`)) {
      return this.onQueryQuestion(message);
    }
    if (message.raw_message.startsWith(`删除问题`)) {
      return this.onDeleteQuestion(message);
    }
    if (/^伤害|无视|攻击/.test(message.raw_message)) {
      return '进入 https://acceyuriko.github.io/MapleCalc/#/home 完成详细计算哦~';
    }
    if (/^扔.*?\[CQ:at/.test(message.raw_message)) {
      return this.onThrowSomeone(message);
    }
    if (/^(揍|打).*?\[CQ:at/.test(message.raw_message)) {
      return this.onPunchSomeone(message);
    }
    if (/^roll/i.test(message.raw_message)) {
      return `[CQ:at,qq=${message.user_id}] ${Math.floor(Math.random() * 100)}`;
    }
    if (/^星星|星之?力/.test(message.raw_message)) {
      return [
        `防具正推: ${CONFIG.botName}[等级][星星]`,
        `eg: ${CONFIG.botName}150级17星`,
        `注：1.目前只支持130, 140, 150, 160, 200级装备计算`,
        `2. 目前只支持普通装备0-22星计算，不支持极真等特殊装备`,
      ].join('\n');
    }
    if (/^\d+级\d+星/.test(message.raw_message)) {
      return this.onStarForce(message);
    }

    if (/^复读机周报/.test(message.raw_message)) {
      return this.onRereadWeekly(message);
    }
    if (/^(车车?|叫车|发车|到站|下车)/.test(message.raw_message)) {
      return this.onCar(message);
    }

    // TODO: 占卜
    // TODO: 算术
    return this.onOther(message);
  }

  private async onLegionQuery(message: Message): Promise<string> {
    let name = message.raw_message.slice(4).trim();
    if (name === '') {
      const rank = await RankInfo.findOne({ where: { userId: message.user_id } });
      if (!rank) {
        return `请先绑定角色\r\n` + `例如： 查询绑定JulyMeowMeow`;
      }
      name = rank.userName;
    } else if (name.includes('[CQ:at,qq=')) {
      const match = name.match(/\[CQ:at,qq=(.*?)]/);
      const rank = await RankInfo.findOne({ where: { userId: match![1] } });
      if (!rank) {
        return `请先绑定角色\r\n` + `例如： 查询绑定JulyMeowMeow`;
      }
      name = rank.userName;
    }
    try {
      const detail: UserDetail = (
        await axios.get(`https://api.maplestory.gg/v1/public/character/gms/${name}`, {
          headers: {
            'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)',
          },
        })
      ).data;
      return drawService.drawLegion(detail);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.response?.status === 404) {
          return '查询角色不存在';
        }
      }
      return '查询失败';
    }
  }

  private async onQueryBind(message: Message): Promise<string> {
    const name = message.raw_message.slice(4).trim();
    if (name === '') {
      return '笨蛋，你得告诉我绑定的角色名啊';
    }
    await RankInfo.upsert({
      userId: message.user_id,
      userName: name,
    });
    return '绑定成功';
  }

  private async onLearnQuestion(message: Message) {
    if (![...CONFIG.managerId, CONFIG.masterId].includes(message.user_id)) {
      return this.permissionDenied();
    }
    const questionIndex = message.raw_message.indexOf('问');
    const answerIndex = message.raw_message.indexOf('答');
    const question = message.raw_message.slice(questionIndex + 1, answerIndex).trim();
    let answer = message.raw_message.slice(answerIndex + 1).trim();
    const matches = answer.match(/\[CQ:image,file=.*?\]/g);
    if (matches) {
      for (const match of matches) {
        const imageName = `[CQ:image,file=save/${await this.downloadImage(match)}]`;
        answer = answer.replace(match, imageName);
      }
    }
    await Msg.create({ question, answer, createId: message.user_id });
    return `[CQ:image,file=${CONFIG.imageUrl}img/record.gif]`;
  }

  private async onQueryQuestion(message: Message) {
    if (![...CONFIG.managerId, CONFIG.masterId].includes(message.user_id)) {
      return this.permissionDenied();
    }
    const questions = await Msg.findAll({
      where: { question: { [Op.like]: `%${message.raw_message.replace(`${CONFIG.botName}查询`, '')}%` } },
    });
    if (questions.length === 0) {
      return '查询结果为空';
    }
    let text = '';
    for (const question of questions) {
      if (text.length > 0) {
        text += '\n';
      }
      text += `ID: ${question.id}\n`;
      text += `问题: ${question.question}\n`;
      text += `答案: ${question.answer}\n`;
    }

    return text;
  }

  private async onDeleteQuestion(message: Message) {
    if (![...CONFIG.managerId, CONFIG.masterId].includes(message.user_id)) {
      return this.permissionDenied();
    }
    const ids = message.raw_message
      .replace(`${CONFIG.botName}删除问题`, '')
      .split(',')
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    const questions = await Msg.findAll({ where: { id: { [Op.in]: ids } } });
    if (questions.length === 0) {
      return `指定问题(${ids.join(',')})不存在`;
    }
    await Msg.destroy({ where: { id: { [Op.in]: ids } } });
    return `删除成功 (${questions.map((i) => i.id).join(',')})`;
  }

  private async onThrowSomeone(message: Message) {
    const match = message.raw_message.match(/\[CQ:at,qq=(.*?)]/)!;
    let qq = match[1];
    if (qq === CONFIG.botId.toString()) {
      qq = message.user_id.toString();
    }
    const avatar = await this.downloadAvatar(qq);
    return drawService.throwSomeone(avatar);
  }

  private async onPunchSomeone(message: Message) {
    const match = message.raw_message.match(/\[CQ:at,qq=(.*?)]/)!;
    let qq = match[1];
    if (qq === CONFIG.botId.toString()) {
      qq = message.user_id.toString();
    }
    const avatar = await this.downloadAvatar(qq);
    return drawService.punchSomeone(avatar);
  }

  private async onStarForce(message: Message): Promise<string> {
    const match = message.raw_message.match(/(\d+)级(\d+)星/);
    if (!match?.[1] || !match?.[2]) {
      return `输入数据异常`;
    }
    const level = parseInt(match[1]);
    const star = parseInt(match[2]);
    if (isNaN(level) || isNaN(star)) {
      return `输入数据异常`;
    }
    if (![130, 140, 150, 160, 200].includes(level)) {
      return '只能计算等级为130, 140, 150, 160, 200的装备';
    }
    if (star < 0 || (level === 130 && star > 20) || star > 25) {
      return '超出星之力范围';
    }
    const table = STAR_FORCE_AFTER_16[level as keyof typeof STAR_FORCE_AFTER_16];
    let totalStat = 0;
    let totalAtt = 0;
    for (let i = 0; i < star; i++) {
      if (i < 5) {
        totalStat += 2;
      } else if (i < 15) {
        totalStat += 3;
      } else {
        totalStat += table.stat[i - 15];
        totalAtt += table.att[i - 15];
      }
    }
    return `${level} 级装备 ${star} 星的加成为： 主属 ${totalStat}, 攻击 ${totalAtt}`;
  }

  private async onRereadWeekly(message: Message): Promise<string> {
    const weekly = await taskService.generateRereadWeekly();
    return weekly.find((i) => i.groupId === message.group_id)?.text || '';
  }

  private async onCar(message: Message): Promise<string> {
    const cars = (await Car.findAll()).map((i) => i.name);
    if (/^车车?/.test(message.raw_message)) {
      return (
        `欢迎使用蠢猫打车😊\n` +
        `目前支持以下指令：\n` +
        `蠢猫叫车[车牌]: 开始等车，有大佬发车时会收到艾特\n` +
        `蠢猫发车[车牌]: 大佬发车，蠢猫会艾特所有叫车的同学\n` +
        `蠢猫下车[车牌]: 你已经是大佬了，不用再叫车了\n` +
        `蠢猫到站[车牌]: 这个周期内已经上过车了，本周期内其他大佬的车车不会再艾特你\n\n` +
        `目前的车车有 ${cars.join(', ')}`
      );
    }
    if (/^叫车/.test(message.raw_message)) {
      const name = message.raw_message.slice(2).trim();
      if (!cars.includes(name)) {
        return `[CQ:at,qq=${message.user_id}]笨蛋叫错车了，目前的车车有 ${cars.join(', ')}`;
      }
      db.transaction(async () => {
        const record = (await Car.findOne({ where: { name } }))!;
        const waitings = record.waiting.split(',').filter(Boolean);
        const finished = record.finished.split(',').filter(Boolean);

        await Car.update(
          {
            waiting: uniq([...waitings, message.user_id.toString()]).join(','),
            finished: finished.filter((i) => i !== message.user_id.toString()).join(','),
          },
          { where: { name } },
        );
      });
      return `[CQ:at,qq=${message.user_id}]系统已为您派单，请等待车主接单`;
    }
    if (/^发车/.test(message.raw_message)) {
      const name = message.raw_message.slice(2).trim();
      if (!cars.includes(name)) {
        return `[CQ:at,qq=${message.user_id}]笨蛋发错车了，目前的车车有 ${cars.join(', ')}`;
      }
      const record = (await Car.findOne({ where: { name } }))!;
      const waitings = difference(
        record.waiting.split(',').filter(Boolean),
        record.finished.split(',').filter(Boolean),
      );
      if (waitings.length === 0) {
        return `[CQ:at,qq=${message.user_id}]马萨卡,暂时没有乘客`;
      }
      return waitings.map((i) => `[CQ:at,qq=${i}]`).join(' ') + '\n' + `活捉老司机，没时间解释了，快上车!`;
    }
    if (/^到站/.test(message.raw_message)) {
      const name = message.raw_message.slice(2).trim();
      if (!cars.includes(name)) {
        return `[CQ:at,qq=${message.user_id}]笨蛋下错站了，目前的车车有 ${cars.join(', ')}`;
      }
      db.transaction(async () => {
        const record = (await Car.findOne({ where: { name } }))!;
        const finished = record.finished.split(',').filter(Boolean);
        await Car.update(
          {
            finished: uniq([...finished, message.user_id.toString()]).join(','),
          },
          { where: { name } },
        );
      });
      return `[CQ:at,qq=${message.user_id}]本次旅程已结束，请带好手机、提包等随身物品，欢迎下次光临~`;
    }
    if (/^下车/.test(message.raw_message)) {
      const name = message.raw_message.slice(2).trim();
      if (!cars.includes(name)) {
        return `[CQ:at,qq=${message.user_id}]笨蛋下错车了，目前的车车有 ${cars.join(', ')}`;
      }
      db.transaction(async () => {
        const record = (await Car.findOne({ where: { name } }))!;
        const waitings = record.waiting.split(',').filter(Boolean);
        const finished = record.finished.split(',').filter(Boolean);
        await Car.update(
          {
            waiting: waitings.filter((i) => i !== message.user_id.toString()).join(','),
            finished: finished.filter((i) => i !== message.user_id.toString()).join(','),
          },
          { where: { name } },
        );
      });
      return `[CQ:at,qq=${message.user_id}]你已经是新的司机啦，快和萌新打个招呼吧~`;
    }
    return '';
  }

  private async onOther(message: Message) {
    const questions = await Msg.findAll({ where: { question: { [Op.like]: `%${message.raw_message.trim()}%` } } });
    if (questions.length === 0) {
      const answers = ['1.gif', '2.gif', '3.png', '4.png', '5.png'];
      return `[CQ:image,file=${CONFIG.imageUrl}img/buzhidao${answers[Math.floor(Math.random() * answers.length)]}]`;
    }
    const { answers } = questions.reduce(
      (pre, cur) => {
        const distance = leven.get(message.raw_message, cur.question);
        if (distance < pre.distance) {
          return { distance, answers: [cur.answer] };
        }
        if (distance === pre.distance) {
          pre.answers.push(cur.answer);
        }
        return pre;
      },
      { distance: Infinity, answers: [] as string[] },
    );

    return answers[Math.floor(Math.random() * answers.length)];
  }

  private async onMsgNoPrefix(message: Message) {
    const questions = (await MsgNoPrefix.findAll()).filter((i) => message.raw_message.includes(i.question));
    const exact = questions.find((i) => i.exact && i.question === message.raw_message);
    let answer = '';
    if (exact) {
      answer = exact.answer;
    }
    if (questions.length > 0) {
      answer = questions[Math.floor(Math.random() * questions.length)].answer;
    }
    return answer;
  }

  private async onReread(message: Message) {
    const messages = this.rereadMessage[message.group_id] || [];
    const newItem = {
      messageId: message.message_id,
      content: message.raw_message,
      userId: message.user_id,
      createdAt: Date.now(),
    };
    if (messages.length === 0) {
      this.rereadMessage[message.group_id] = [newItem];
      return '';
    }
    let isBreakReread = false;
    const last = messages[messages.length - 1];
    if (Date.now() - last.createdAt > 5 * 60 * 1000) {
      isBreakReread = true;
    } else if (last.content.includes('[CQ:image,file=')) {
      if (message.raw_message.includes('[CQ:image,file=')) {
        const regexp = /\[CQ:image,file=(.+?\.image)/;
        const match1 = last.content.match(regexp);
        const match2 = message.raw_message.match(regexp);
        isBreakReread = match1?.[1] !== match2?.[1];
      } else {
        isBreakReread = true;
      }
    } else {
      isBreakReread = last.content !== message.raw_message;
    }

    if (isBreakReread) {
      if (messages.length >= 2) {
        await RereadMsg.create({
          groupId: message.group_id.toFixed(0),
          messageId: messages[0].messageId,
          content: messages[0].content,
          creator: messages[0].userId.toFixed(0),
          count: messages.length - 1,
        });
        const userIds = messages.slice(1).map((i) => i.userId);
        const records = await RereadUser.findAll({ where: { userId: userIds } });
        const needToCreate = difference(
          userIds.map((i) => i.toString()),
          records.map((i) => i.userId),
        );
        if (needToCreate.length > 0) {
          await RereadUser.bulkCreate(
            needToCreate.map((i) => ({
              groupId: message.group_id,
              userId: i,
              count: 0,
            })),
          );
        }
        await RereadUser.increment('count', {
          by: 1,
          where: { groupId: message.group_id, userId: userIds },
        });
      }
      this.rereadMessage[message.group_id] = [newItem];
      return '';
    }

    if (!messages.find((i) => i.userId === message.user_id)) {
      messages.push(newItem);
      this.rereadMessage[message.group_id] = messages;
      if (messages.length === 3) {
        return message.raw_message;
      }
    }

    return '';
  }

  private async permissionDenied() {
    return '(￣ε(#￣) 宁是什么东西也配命令老娘？爬爬爬！';
  }

  private async downloadImage(imageCq: string): Promise<string> {
    const url = imageCq.match(/file=(.*?)\]/)![1];
    // const res = await axios.get(url, { responseType: 'arraybuffer' });
    // const buffer: Buffer = res.data;
    // const buffer = await fs.promises.readFile(url);
    // const filename = hash(buffer) + '.' + mime.getExtension(res.headers['content-type']);
    // await fs.promises.writeFile(path.resolve(CONFIG.imageUrl, 'save', filename), buffer);
    const filename = path.basename(url);
    let interval: NodeJS.Timer | undefined = undefined;
    let imgExists = false;
    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, 60 * 1000)),
      new Promise<void>((resolve) => {
        interval = setInterval(() => {
          fs.exists(url, (exists) => {
            if (exists) {
              imgExists = true;
              resolve();
            }
          });
        }, 200);
      }),
    ]);
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    if (imgExists) {
      await fs.promises.copyFile(url, path.join(CONFIG.imageUrl, 'save', filename));
      return filename;
    }
    throw new Error('图片下载失败了哟~');
  }

  private async downloadAvatar(qq: string): Promise<string> {
    const avatar = path.resolve(CONFIG.imageUrl, 'temp', `avatar-${qq}.jpg`);
    const res = await axios.get(`http://q1.qlogo.cn/g?b=qq&nk=${qq}&s=3`, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(avatar, res.data);
    return avatar;
  }

  private recentMessage: string[] = [];
  private rereadMessage: Record<string, { messageId: string; content: string; userId: number; createdAt: number }[]> =
    {};
}

export const messageService = new MessageService();
