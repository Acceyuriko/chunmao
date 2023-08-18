import axios from 'axios';
import fs from 'fs';
import mime from 'mime';
import path from 'path';
import { Op } from 'sequelize';

import { CONFIG } from '../config';
import { Msg } from '../db';
import { STAR_FORCE_AFTER_16 } from '../utils/constant';
import { hash } from '../utils/hash';
import { logger } from '../utils/logger';
import { Message } from '../utils/types';
import { drawService } from './draw.service';

export class MessageService {
  public async handle(message: Message): Promise<string> {
    if (!CONFIG.groupId.includes(message.group_id)) {
      return '';
    }

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
    if (message.post_type === 'message' && message.sub_type === 'normal') {
      if (message.self_id === message.user_id || CONFIG.blacklist.includes(message.user_id)) {
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
    return '';
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

    // TODO: 占卜
    // TODO: 算术
    return this.onOther(message);
  }

  private async onLegionQuery(message: Message): Promise<string> {
    console.log(message);
    return '';
  }

  private async onQueryBind(message: Message): Promise<string> {
    console.log(message);
    return '';
  }

  private async onLearnQuestion(message: Message) {
    if (![...CONFIG.managerId, CONFIG.masterId].includes(message.user_id)) {
      return this.permissionDenied();
    }
    const questionIndex = message.raw_message.indexOf('问');
    const answerIndex = message.raw_message.indexOf('答');
    const question = message.raw_message.slice(questionIndex + 1, answerIndex).trim();
    let answer = message.raw_message.slice(answerIndex + 1).trim();
    const matches = answer.match(/\[CQ:image.*?url=.*?\]/g);
    if (matches) {
      for (const match of matches) {
        const imageName = `[CQ:image,file=save/${await this.downloadImage(match)}]`;
        answer = answer.replace(match, imageName);
      }
    }
    await Msg.create({ question, answer, create_id: message.user_id });
    return '[CQ:image,file=img/record.gif]';
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
    if (qq === message.self_id.toString()) {
      qq = message.user_id.toString();
    }
    const avatar = await this.downloadAvatar(qq);
    return drawService.throwSomeone(avatar);
  }

  private async onPunchSomeone(message: Message) {
    const match = message.raw_message.match(/\[CQ:at,qq=(.*?)]/)!;
    let qq = match[1];
    if (qq === message.self_id.toString()) {
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

  private async onOther(message: Message) {
    const questions = await Msg.findAll({ where: { question: { [Op.like]: `%${message.raw_message.trim()}%` } } });
    if (questions.length === 0) {
      const answers = ['1.gif', '2.gif', '3.png', '4.png', '5.png'];
      return `[CQ:image,file=img/buzhidao${answers[Math.floor(Math.random() * answers.length)]}]`;
    }
    return questions[Math.floor(Math.random() * questions.length)].answer;
  }

  private async permissionDenied() {
    return '(￣ε(#￣) 宁是什么东西也配命令老娘？爬爬爬！';
  }

  private async downloadImage(imageCq: string): Promise<string> {
    const url = imageCq.match(/url=(.*?)\]/)![1];
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer: Buffer = res.data;
    const filename = hash(buffer) + '.' + mime.getExtension(res.headers['content-type']);
    await fs.promises.writeFile(path.resolve(CONFIG.imageUrl, filename), buffer);
    return filename;
  }

  private async downloadAvatar(qq: string): Promise<string> {
    const avatar = path.resolve(CONFIG.imageUrl, 'temp', `avatar-${qq}.jpg`);
    const res = await axios.get(`http://q1.qlogo.cn/g?b=qq&nk=${qq}&s=3`, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(avatar, res.data);
    return avatar;
  }

  private recentMessage: number[] = [];
}

export const messageService = new MessageService();
