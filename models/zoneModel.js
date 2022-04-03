"use strict";
export default (sequelize, DataTypes) => {
  const Zone = sequelize.define("zone", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.VIRTUAL,
      get() {
        let code = "BLC";
        for (var i = 0; i < 3 - this.id.toString().length; i++) {
          code += "0";
        }
        code += this.id.toString();
        return code;
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Zone name required!",
        },
      },
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      validate: {
        min: -90,
        max: 90,
      },
    },
    latitude: {
      type: DataTypes.DOUBLE,
      validate: {
        min: -180,
        max: 180,
      },
    },
    user: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  return Zone;
};
