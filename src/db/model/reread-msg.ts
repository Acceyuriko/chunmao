import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'reread_msg',
  indexes: [
    {
      name: 'group_message',
      unique: true,
      fields: ['groupId', 'messageId'],
    },
  ],
})
class RereadMsg extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING })
  declare groupId: string;

  @Column({ type: DataType.STRING, unique: true })
  declare messageId: string;

  @Column(DataType.STRING)
  declare content: string;

  @Column(DataType.STRING)
  declare creator: string;

  @Column(DataType.INTEGER)
  declare count: number;
}

export { RereadMsg };
