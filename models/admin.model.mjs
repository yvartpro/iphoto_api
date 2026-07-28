import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default (sequelize) => {
  const Admin = sequelize.define("Admin", {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
    {
      timestamps: true,
      tableName: "iphoto_admins"
    }
  );

  return Admin;
};