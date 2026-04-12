import { sequelize } from "../config/db.config.mjs";
import UserModel from "./user.model.mjs";

const db = {};

db.sequelize = sequelize;
db.Sequelize = sequelize.Sequelize;

db.User = UserModel(sequelize);

export default db;