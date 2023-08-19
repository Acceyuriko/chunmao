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
