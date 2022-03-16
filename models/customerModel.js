export default (sequelize, DataTypes) => {
  const Customer = sequelize.define("customer", {
    customer_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    firstname: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notNull: {
          msg: "First name required!",
        },
        isAlpha: {
          args: true,
          msg: "First name invalid!",
        },
      },
    },
    lastname: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notNull: {
          msg: "Last name required!",
        },
        isAlpha: {
          args: true,
          msg: "Last name invalid!",
        },
      },
    },
    gender: {
      type: DataTypes.ENUM,
      values: ["male", "female"],
    },
    identity_number: {
      type: DataTypes.STRING(9),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Customer identity required!",
        },
        isNumeric: {
          args: true,
          msg: "Invalid identity number!",
        },
        len: 9,
      },
    },
    contact: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      validate: {
        len: 9,
        isNumeric: {
          args: true,
          msg: "Please provide numeric contact!",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: {
          args: true,
          msg: "Please provide a valid email!",
        },
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Please provide customer address!",
        },
      },
    },
  });
  return Customer;
};
