// seed admin user
import db from "./models/index.mjs";
import bcrypt from "bcrypt";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const seed = async () => {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.User.create({
      email,
      password: hashedPassword,
      role: "admin",
      is_active: true,
    });
    console.log("Admin user created successfully");
  } catch (error) {
    console.error(error);
  }
};

seed();