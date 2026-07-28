import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default (sequelize) => {
  const Device = sequelize.define("Device", {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    device_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    plan: {
      type: DataTypes.ENUM("FREE", "MONTHLY", "SEMI_ANNUAL", "ANNUAL"),
      defaultValue: "FREE"
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
    {
      timestamps: true,
      tableName: "iphoto_devices"
    }
  );

  return Device;
};