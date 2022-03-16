export default (sequelize, DataTypes) => {
  const Session = sequelize.define("session", {
    sessionId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: Date.now(),
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "close",
    },
    openBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Who opened the session! Please provide user.",
        },
      },
    },
    closeBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Who closed the session! Please provide user.",
        },
      },
    },
  });
  return Session;
};
