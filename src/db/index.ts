import { Sequelize } from 'sequelize-typescript';

import { Msg } from './model/msg';
import { MsgNoPrefix } from './model/msg-no-prefix';
import { RankInfo } from './model/rank-info';
import { RereadMsg } from './model/reread-msg';
import { RereadUser } from './model/reread-user';

const db = new Sequelize({
  dialect: 'sqlite',
  storage: './chunmao.sqlite',
  models: [Msg, MsgNoPrefix, RankInfo, RereadMsg, RereadUser],
  logging: false,
});

export * from './model/msg';
export * from './model/msg-no-prefix';
export * from './model/rank-info';
export * from './model/reread-msg';
export * from './model/reread-user';
export { db };
