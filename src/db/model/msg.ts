import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'msg',
})
class Msg extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.STRING)
  declare answer: string;

  @Column(DataType.STRING)
  declare question: string;

  @Column(DataType.STRING)
  declare createId: string;

  @Column(DataType.STRING)
  declare link: string;
}

export { Msg };
