import express from "express";
import dotenv from "dotenv";
import db from "./models/index.mjs";
import userRoutes from "./routes/user.routes.mjs";
import adminRoutes from "./routes/admin.routes.mjs";
import { errorMiddleware } from "./middlewares/error.middleware.mjs";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/iphoto/", (req, res) => {
  res.json({ message: "iPhoto API est en cours d'exécution" });
});
app.use("/iphoto/api", userRoutes);
app.use("/iphoto/api/admin", adminRoutes);

app.use(errorMiddleware);

const start = async () => {
  try {
    await db.sequelize.sync();
    app.listen(process.env.PORT || 3000, () => {
      console.log("Serveur en cours d'exécution");
    });
  } catch (err) {
    console.error(err);
  }
};

start();