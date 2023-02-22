import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
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
          msg: 'First name is required!',
        },
        isAlpha: {
          args: true,
          msg: 'Please provide a valid first name',
        },
      },
    },
    lastname: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Last name is required!',
        },
        isAlpha: {
          args: true,
          msg: 'Please provide a valid last name',
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
          msg: 'User identity required!',
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
        notNull: {
          msg: 'Please provide user contact',
        },
        len: [9, 13],
      },
    },
    email: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: 'Please provide user email',
        },
        isEmail: {
          args: true,
          msg: 'Please provide a valid email',
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
    photo: {
      type: DataTypes.STRING,
      defaultValue: 'user.png',
    },
    role: {
      type: DataTypes.ENUM,
      values: ['manager', 'accountant', 'collector'],
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide user role',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        min: 8,
        max: 12,
      },
    },
    passwordConfirm: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValid(value) {
          if (value !== this.password) {
            throw new Error('passwords are not the same!');
          }
        },
      },
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
  User.beforeSave(async (user) => {
    if (!user.changed('password')) return;
    user.password = await bcrypt.hash(user.password, 12);
    user.passwordConfirm = user.password;
  });
  User.beforeSave((user) => {
    if (!user.changed('password') || user.isNewRecord) return;
    user.passwordChangedAt = Date.now() - 1000;
  });
  User.beforeSave((user) => {
    user.name = `${user.firstname} ${user.lastname}`;
  });

  User.prototype.correctPassword = async function (
    candidatePassword,
    userPassword
  ) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };

  User.prototype.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );

      return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
  };
  return User;
};
