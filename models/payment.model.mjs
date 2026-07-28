import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default (sequelize) => {
  const Payment = sequelize.define("Payment", {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    device_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transaction_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    plan_key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"),
      defaultValue: "PENDING"
    }
  },
    {
      timestamps: true,
      tableName: "iphoto_payments"
    }
  );

  return Payment;
};