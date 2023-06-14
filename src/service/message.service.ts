import { Message } from '../utils/types';

export class MessageService {
  static async handle(message: Message) {
    console.log(message.message);
    return null;
  }
}
