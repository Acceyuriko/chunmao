import { Sequelize } from 'sequelize-typescript';
import { Msg } from './model/msg';
import { MsgNoPrefix } from './model/msg-no-prefix';
import { CONFIG } from '../config';

const db = new Sequelize(CONFIG.db, {
  models: [Msg, MsgNoPrefix],
  logging: false,
});

export * from './model/msg';
export * from './model/msg-no-prefix';
export { db };
