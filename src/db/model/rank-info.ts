import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'rank_info',
})
class RankInfo extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  declare user_id: string;

  @Column(DataType.TEXT)
  declare user_name: string;
}

export { RankInfo };
