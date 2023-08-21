import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'reread_user',
  indexes: [
    {
      name: 'group_user',
      unique: true,
      fields: ['groupId', 'userId'],
    },
  ],
})
class RereadUser extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING })
  declare groupId: string;

  @Column(DataType.STRING)
  declare userId: string;

  @Column(DataType.INTEGER)
  declare count: number;
}

export { RereadUser };
