'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'reread_msg',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        groupId: {
          type: Sequelize.STRING,
        },
        messageId: {
          type: Sequelize.STRING,
        },
        content: {
          type: Sequelize.STRING,
        },
        creator: {
          type: Sequelize.STRING,
        },
        count: {
          type: Sequelize.INTEGER,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        uniqueKeys: {
          group_message: {
            fields: ['groupId', 'messageId'],
          },
        },
      },
    );

    await queryInterface.createTable(
      'reread_user',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        groupId: {
          type: Sequelize.STRING,
        },
        userId: {
          type: Sequelize.STRING,
        },
        count: {
          type: Sequelize.INTEGER,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        uniqueKeys: {
          group_user: { fields: ['groupId', 'userId'] },
        },
      },
    );
  },
  async down(queryInterface) {
    await queryInterface.dropTable('reread_msg');
    await queryInterface.dropTable('reread_user');
  },
};
