export default (sequelize, DataTypes) => {
  const Source = sequelize.define("source", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.fn("NOW"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Source amount required!",
        },
        isNumeric: {
          args: true,
          msg: "Invalid amount!",
        },
      },
    },
    zone: {
      type: DataTypes.INTEGER,
      references: {
        model: "zones",
        key: "id",
      },
    },
  });
  return Source;
};
