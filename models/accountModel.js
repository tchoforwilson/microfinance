export default (sequelize, DataTypes) => {
  const Account = sequelize.define("account", {
    account_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    account_name: {
      type: DataTypes.STRING(40),
    },
    type: {
      type: DataTypes.ENUM,
      values: ["customer", "user", "source"],
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isNumeric: {
          args: false,
          msg: "Invalid non-numeric balance!",
        },
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    date_opened: {
      type: DataTypes.DATEONLY,
      defaultValue: Date.now(),
    },
    date_closed: {
      type: DataTypes.DATEONLY,
    },
  });
  return Account;
};
