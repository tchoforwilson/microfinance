export default (sequelize, DataTypes) => {
  const Loan = sequelize.define("loan", {
    loan_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Loan must have an amount",
        },
      },
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
    status: {
      type: DataTypes.ENUM,
      values: ["paid", "unpaid", "remainder"],
      defaultValue: "unpaid",
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: Date.now(),
    },
  });
  return Loan;
};
