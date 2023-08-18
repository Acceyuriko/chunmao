export interface Message {
  post_type: 'message' | 'message_sent' | 'request' | 'notice' | 'meta_event';
  message_type: 'group' | 'private';
  time: number;
  self_id: number;
  area: string;
  card: string;
  level: string;
  nickname: string;
  role: string;
  sex: 'unknown';
  message: string;
  message_seq: number;
  sender: {
    age: number;
    area: string;
    card: string;
    level: string;
    nickname: string;
    role: string;
    sex: string;
    title: string;
    user_id: string;
  };
  user_id: number;
  message_id: number;
  group_id: number;
  anonymous: null;
  font: number;
  raw_message: string;
  notice_type: 'group_increase' | 'group_decrease';
  sub_type: 'approve' | 'invite' | 'normal';
}
