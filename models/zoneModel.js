"use strict";
export default (sequelize, DataTypes) => {
  const Zone = sequelize.define("zone", {
    zone_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
  });
  return Zone;
};
