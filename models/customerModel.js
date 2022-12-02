export default (sequelize, DataTypes) => {
  const Customer = sequelize.define('customer', {
    id: {
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
          msg: 'First name required!',
        },
        isAlpha: {
          args: true,
          msg: 'First name invalid!',
        },
      },
    },
    middlename: {
      type: DataTypes.STRING(30),
    },
    lastname: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Last name required!',
        },
        isAlpha: {
          args: true,
          msg: 'Last name invalid!',
        },
      },
    },
    name: {
      type: DataTypes.STRING,
    },
    gender: {
      type: DataTypes.ENUM,
      values: ['male', 'female'],
    },
    identity: {
      type: DataTypes.STRING(9),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: 'Customer identity required!',
        },
        isNumeric: {
          args: true,
          msg: 'Invalid identity number!',
        },
        len: 9,
      },
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: {
          args: true,
          msg: 'Please provide numeric contact!',
        },
        len: [9, 13],
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: {
          args: true,
          msg: 'Please provide a valid email!',
        },
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide customer address!',
        },
      },
    },
    zone: {
      type: DataTypes.INTEGER,
      references: {
        model: 'zones',
        key: 'id',
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  // create customer name from first and last name
  Customer.beforeSave((customer) => {
    customer.name = `${customer.firstname} ${customer.middlename} ${customer.lastname}`;
  });
  return Customer;
};
