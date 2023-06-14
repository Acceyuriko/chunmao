import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'msg_no_prefix',
})
class MsgNoPrefix extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.TEXT)
  declare answer: string;

  @Column(DataType.TEXT)
  declare question: string;

  @Column(DataType.BOOLEAN)
  declare exact: boolean;
}

export { MsgNoPrefix };
