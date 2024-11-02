export default (sequelize, DataTypes) => {
  const Transaction = sequelize.define('transaction', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.fn('NOW'),
    },
    type: {
      type: DataTypes.ENUM,
      values: ['deposit', 'withdrawal'],
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Transaction type!',
        },
      },
    },
    user: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Amount in transaction required!',
        },
        isNumeric: {
          args: true,
          msg: 'Invalid amount!',
        },
      },
    },
    account: {
      type: DataTypes.INTEGER,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  return Transaction;
};
