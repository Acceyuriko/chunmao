import { Message } from '../utils/types';

export class MessageService {
  static async handle(message: Message) {
    if (this.recentMessage.includes(message.message_id)) {
      return null;
    }
    this.recentMessage.push(message.message_id);
    if (this.recentMessage.length > 1024) {
      this.recentMessage.shift();
    }

    if (message.post_type === 'notice') {
      if (message.notice_type === 'group_increase') {
        return this.onWelcome(message);
      }
    }

    return null;
  }

  static async onWelcome(message: Message) {
    console.log(message.message);
    return null;
  }

  static async onLegionQuery(message: Message) {
    console.log(message.message);
    return null;
  }

  private static recentMessage: number[] = [];
}
