import { Sequelize } from 'sequelize-typescript';

import { Msg } from './model/msg';
import { MsgNoPrefix } from './model/msg-no-prefix';
import { RankInfo } from './model/rank-info';

const db = new Sequelize({
  dialect: 'sqlite',
  storage: './chunmao.sqlite',
  models: [Msg, MsgNoPrefix, RankInfo],
  logging: false,
});

export * from './model/msg';
export * from './model/msg-no-prefix';
export * from './model/rank-info';
export { db };
