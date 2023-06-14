import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'msg',
})
class Msg extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.TEXT)
  declare answer: string;

  @Column(DataType.TEXT)
  declare question: string;

  @Column(DataType.TEXT)
  declare create_id: string;

  @Column(DataType.TEXT)
  declare link: string;
}

export { Msg };
