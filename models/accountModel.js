export default (sequelize, DataTypes) => {
  const Account = sequelize.define("account", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.VIRTUAL,
      get() {
        let code = "CECAEC";
        for (var i = 0; i < 4 - this.id.toString().length; i++) {
          code += "0";
        }
        code += this.id.toString();
        return code;
      },
    },
    name: {
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
    user: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    customer: {
      type: DataTypes.INTEGER,
      references: {
        model: "customers",
        key: "id",
      },
    },
    dateOpened: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    dateClosed: {
      type: DataTypes.DATEONLY,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  return Account;
};
