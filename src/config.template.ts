// 配置模板
export const CONFIG = {
  port: 6624,
  miraiUrl: 'C://myfile/go-cqhttp',
  get imageUrl() {
    return this.miraiUrl + '/data/images/';
  },
  botName: '蠢猫',
  // 机器人 qq
  botId: 111,
  // 自己的 qq，超级管理员
  masterId: 111,
  // 管理员 qq
  managerId: [111] as number[],
  // 允许发言的群号
  groupId: [111] as number[],
  blacklist: [] as number[],
};
