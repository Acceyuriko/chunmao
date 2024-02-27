export interface Message {
  post_type: 'message' | 'message_sent' | 'request' | 'notice' | 'meta_event';
  // message_type: 'group' | 'private';
  // time: number;
  // self_id: number;
  // area: string;
  // card: string;
  // level: string;
  // nickname: string;
  // role: string;
  // sex: 'unknown';
  // message: string;
  // message_seq: number;
  // sender: {
  //   age: number;
  //   area: string;
  //   card: string;
  //   level: string;
  //   nickname: string;
  //   role: string;
  //   sex: string;
  //   title: string;
  //   user_id: string;
  // };
  user_id: number;
  message_id: string;
  group_id: number;
  // anonymous: null;
  // font: number;
  raw_message: string;
  notice_type: 'group_increase' | 'group_decrease';
  sub_type: 'approve' | 'invite' | 'normal';
}

export interface UserDetail {
  AchievementPoints: number;
  AchievementRank: number;
  CharacterImageURL: string;
  Class: string;
  ClassRank: number;
  EXP: number;
  EXPPercent: number;
  GlobalRanking: number;
  GraphData?: {
    AvatarURL: string;
    ClassID: number;
    ClassRankGroupID: number;
    CurrentEXP: number;
    DateLabel: string; // '2023-08-03';
    EXPDifference: number;
    EXPToNextLevel: number;
    ImportTime: number;
    Level: number;
    Name: string;
    ServerID: number;
    ServerMergeID: number;
    TotalOverallEXP: number;
  }[];
  Guild: string;
  LegionCoinsPerDay?: number;
  LegionLevel: number;
  LegionPower: number;
  LegionRank: number;
  Level: number;
  Name: string;
  Server: string;
  ServerClassRanking: number;
  ServerRank: number;
  ServerSlug: string;
}

export interface GroupMember {
  group_id: number; //群号
  user_id: number; //	QQ 号
  nickname: string; //	昵称
  card: string; //	群名片／备注
  sex: string; //	性别, male 或 female 或 unknown
  age: number; //年龄
  area: string; //	地区
  join_time: number; // 加群时间戳
  last_sent_time: number; // 最后发言时间戳
  level: string; //	成员等级
  role: string; //	角色, owner 或 admin 或 member
  unfriendly: boolean; //	是否不良记录成员
  title: string; //	专属头衔
  title_expire_time: number; // 专属头衔过期时间戳
  card_changeable: boolean; //	是否允许修改群名片
  shut_up_timestamp: number; //禁言到期时间
}
