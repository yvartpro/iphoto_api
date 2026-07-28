import { sequelize } from "../config/db.config.mjs";
import DeviceModel from "./device.model.mjs";
import PaymentModel from "./payment.model.mjs";
import AdminModel from "./admin.model.mjs";

const db = {};

db.sequelize = sequelize;
db.Sequelize = sequelize.Sequelize;

db.Device = DeviceModel(sequelize);
db.Payment = PaymentModel(sequelize);
db.Admin = AdminModel(sequelize);

export default db;