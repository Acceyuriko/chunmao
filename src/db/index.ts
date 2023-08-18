import { Sequelize } from 'sequelize-typescript';

import { Msg } from './model/msg';
import { MsgNoPrefix } from './model/msg-no-prefix';

const db = new Sequelize({
  dialect: 'sqlite',
  storage: './chunmao.sqlite',
  models: [Msg, MsgNoPrefix],
  logging: false,
});

export * from './model/msg';
export * from './model/msg-no-prefix';
export { db };
