import express from "express";
import dotenv from "dotenv";
import db from "./models/index.mjs";
import userRoutes from "./routes/user.routes.mjs";
import adminRoutes from "./routes/admin.routes.mjs";
import { errorMiddleware } from "./middlewares/error.middleware.mjs";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "iPhoto API is running" });
});
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorMiddleware);

const start = async () => {
  try {
    await db.sequelize.sync();
    app.listen(process.env.PORT || 3000, () => {
      console.log("Server running");
    });
  } catch (err) {
    console.error(err);
  }
};

start();