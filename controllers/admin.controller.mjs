import db from "../models/index.mjs";

export const createUser = async (req, res) => {
  const { device_id, plan } = req.body;

  if (!device_id) {
    return res.status(400).json({ message: "Device ID requis" });
  }

  const device = await db.Device.create({
    device_id,
    plan: plan || "FREE",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  res.json(device);
};

export const extendLicense = async (req, res) => {
  const { deviceId } = req.body;

  const device = await db.Device.findOne({ where: { device_id: deviceId } });
  if (!device) return res.status(404).json({ message: "Appareil non trouvé" });

  let currentExpiry = device.expires_at ? new Date(device.expires_at) : new Date();
  if (currentExpiry < new Date()) currentExpiry = new Date();

  currentExpiry.setMonth(currentExpiry.getMonth() + 1);
  device.expires_at = currentExpiry;
  await device.save();

  res.json({ message: "Prolongé d'un mois" });
};

export const deactivateUser = async (req, res) => {
  const { deviceId } = req.body;

  const device = await db.Device.findOne({ where: { device_id: deviceId } });
  if (!device) return res.status(404).json({ message: "Appareil non trouvé" });

  device.expires_at = new Date(); // Expire immediately
  await device.save();

  res.json({ message: "Désactivé" });
};

export const getAllUsers = async (req, res) => {
  const devices = await db.Device.findAll();
  res.json(devices);
};