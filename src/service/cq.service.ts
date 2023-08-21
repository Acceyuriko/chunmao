import axios from 'axios';

import { GroupMember } from '../utils/types';

export class CqService {
  public constructor(private host: string) {}

  public async sendGroupMessage(group_id: number, message: string, auto_escape = false) {
    console.log({ group_id, message, auto_escape });
    // return this.request('/send_group_msg', { group_id, message, auto_escape });
  }

  public async listMember(group_id: number | string): Promise<GroupMember[]> {
    return this.request('/get_group_member_list', { group_id });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async request(path: string, body: any) {
    const result = await axios.post(`${this.host}${path}`, body);
    if (result.data.retcode === 0) {
      return result.data.data;
    }
    throw new Error(result.data.wording);
  }
}

export const cqService = new CqService('http://192.168.0.112:5700');
