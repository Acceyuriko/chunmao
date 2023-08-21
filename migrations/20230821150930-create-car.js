'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('car', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      cycle: {
        type: Sequelize.ENUM('day', 'month', 'weekday1', 'weekday3', 'weekday4'),
      },
      waiting: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      finished: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    const now = new Date().toISOString();

    try {
      await queryInterface.bulkInsert(
        'car',
        [
          {
            name: 'mpe',
            cycle: 'day',
          },
          {
            name: '日常',
            cycle: 'day',
          },
          {
            name: '三核',
            cycle: 'day',
          },
          {
            name: '周boss',
            cycle: 'weekday4',
          },
          {
            name: 'chuchu',
            cycle: 'weekday1',
          },
          {
            name: '老黑',
            cycle: 'month',
          },
        ].map((i) => ({
          ...i,
          createdAt: now,
          updatedAt: now,
        })),
      );
    } catch (e) {
      console.error(e.stack);
    }
  },
  async down(queryInterface) {
    await queryInterface.dropTable('car');
  },
};
