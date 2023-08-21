/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { db, Msg, MsgNoPrefix, RankInfo } from '../db';

const mysql = new Sequelize({
  dialect: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'msbot',
  logging: false,
});

mysql.authenticate().then(async () => {
  await db.authenticate();

  console.log('select from msg');
  let results: any[] = await mysql.query('select question, answer, createId, link from msg', {
    type: QueryTypes.SELECT,
  });
  console.log(`total ${results.length}`);

  console.log('sync msg');
  await Msg.bulkCreate(
    results.map((i) => ({
      question: i.question,
      answer: i.answer,
      createId: i.createId,
      link: i.link,
    })),
  );

  console.log('select from msg_no_prefix');
  results = await mysql.query('select question, answer, exact from msg_no_prefix', { type: QueryTypes.SELECT });
  console.log(`total ${results.length}`);

  console.log('sync msg_no_prefix');
  await MsgNoPrefix.bulkCreate(
    results.map((i) => ({
      question: i.question,
      answer: i.anwer,
      exact: i.exact,
    })),
  );

  console.log('select from rank_info');
  results = await mysql.query('select user_id, user_name from rank_info', { type: QueryTypes.SELECT });
  console.log(`total ${results.length}`);

  console.log('sync rank_info');
  await RankInfo.bulkCreate(
    results.map((i) => ({
      userId: i.user_id,
      userName: i.user_name,
    })),
  );
});
