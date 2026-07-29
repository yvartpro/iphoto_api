import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import db from "./models/index.mjs";
import iphotoRoutes from "./routes/iphoto.routes.mjs";
import adminRoutes from "./routes/admin.routes.mjs";
import { errorMiddleware } from "./middlewares/error.middleware.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// Middlewares
app.use(express.json());


// Serve public folder
express.static.mime.define({'application/vnd.android.package-archive': ['apk']});
app.use(express.static(path.join(__dirname, "public")));


// Frontend entry point
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use("/iphoto/api", iphotoRoutes);
app.use("/iphoto/api/admin", adminRoutes);


// Error handler (must be last)
app.use(errorMiddleware);


// Start server
const start = async () => {
  try {
    await db.sequelize.sync({ alter: true });
    app.listen(process.env.PORT || 3000, () => {
      console.log("Serveur en cours d'exécution");
    });

  } catch (err) {
    console.error("Erreur démarrage serveur:", err);
    process.exit(1);
  }
};

start();
