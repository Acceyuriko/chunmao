import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'car',
})
class Car extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.ENUM('day', 'month', 'weekday1', 'weekday3', 'weekday4'))
  declare cycle: string;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
  })
  declare waiting: string;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
  })
  declare finished: string;
}

export { Car };
