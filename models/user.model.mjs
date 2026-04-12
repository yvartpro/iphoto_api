import { DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expires_at: {
      type: DataTypes.DATE
    },
    device_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return User;
};