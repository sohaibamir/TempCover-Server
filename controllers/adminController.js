import asyncHandler from "express-async-handler";
import Admin from "../models/adminModel.js";
import Insurance from "../models/insuranceModel.js";
import nodemailer from "nodemailer";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { generateToken, generateLinkToken } from "../utils/tokenUtils.js";
import { emailTemplate } from "../templates/emailTemplate.js";

// Create admin
export const createAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const admin = await Admin.create({ email, password });
  res.status(201).json({
    admin,
    message: "Admin created successfully",
  });
});

// Login admin
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      user: admin,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401);
    throw new ErrorHandler("Invalid email or password");
  }
});

// Link for verifying user
export const sendInsuranceLink = asyncHandler(async (req, res) => {
  const { insuranceNo } = req.params;

  const insurance = await Insurance.findOne({ insuranceNo }).populate("user");
  if (!insurance) {
    res.status(404);
    throw new Error("Insurance not found");
  }

  if (!insurance.user || !insurance.user.email) {
    res.status(400);
    throw new Error("No email found for this insurance user");
  }

  const userEmail = insurance.user.email;
  const userName = insurance.user.name;

  const token = generateLinkToken(insurance._id, insurance.user._id);

  const link = `${process.env.CLIENT_URL}/verify/${token}`;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_SENDER,
    to: userEmail,
    subject: "Your Verification Link",
    html: emailTemplate({
      name: userName,
      link,
    }),
  });

  res.json({ message: `Link sent successfully to ${userEmail}` });
});

export const getAdmins = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;

  const count = await Admin.countDocuments();

  const admins = await Admin.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    admins,
    totalPages: Math.ceil(count / limit),
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { currentPassword, password } = req.body;
  console.log(currentPassword, password);

  const admin = await Admin.findById(adminId);
  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  const isMatch = await admin.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  const isSame = await admin.matchPassword(password);
  if (isSame) {
    res.status(400);
    throw new Error("New password cannot be same as the current password");
  }

  admin.password = password;
  await admin.save();

  res.json({ message: "Password updated successfully" });
});
