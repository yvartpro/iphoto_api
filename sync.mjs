import db from "./models/index.mjs";

console.log("Synchronizing database...");

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database synchronized successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error synchronizing database:", error);
    process.exit(1);
  });
