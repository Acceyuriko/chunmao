import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'rank_info',
})
class RankInfo extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare userId: string;

  @Column(DataType.STRING)
  declare userName: string;
}

export { RankInfo };
