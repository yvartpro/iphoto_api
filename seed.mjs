// seed admin user
import db from "./models/index.mjs";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "admin123";

const seed = async () => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.Admin.create({
      username,
      password: hashedPassword
    });
    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

seed();