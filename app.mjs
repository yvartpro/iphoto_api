import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import db from "./models/index.mjs";
import userRoutes from "./routes/user.routes.mjs";
import adminRoutes from "./routes/admin.routes.mjs";
import { errorMiddleware } from "./middlewares/error.middleware.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// Middlewares
app.use(express.json());


// Serve public folder
app.use(express.static(path.join(__dirname, "public")));


// Frontend entry point
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// API routes
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);


// Error handler (must be last)
app.use(errorMiddleware);


// Start server
const start = async () => {
  try {
    await db.sequelize.sync();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
    });

  } catch (err) {
    console.error("Erreur démarrage serveur:", err);
    process.exit(1);
  }
};

start();
