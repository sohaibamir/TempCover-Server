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
  console.log("📩 sendInsuranceLink API called");
  console.log("Params:", req.params);

  const { insuranceNo } = req.params;

  const insurance = await Insurance.findOne({ insuranceNo }).populate("user");
  console.log("Insurance found:", insurance ? insurance._id : null);

  if (!insurance) {
    console.error("❌ Insurance not found");
    res.status(404);
    throw new Error("Insurance not found");
  }

  if (!insurance.user || !insurance.user.email) {
    console.error("❌ User or user email missing", insurance.user);
    res.status(400);
    throw new Error("No email found for this insurance user");
  }

  const userEmail = insurance.user.email;
  const userName = insurance.user.name;

  console.log("User Email:", userEmail);
  console.log("User Name:", userName);

  const token = generateLinkToken(insurance._id, insurance.user._id);
  console.log("Generated Token:", token);

  console.log("CLIENT_URL:", process.env.CLIENT_URL);
  console.log("SMTP_USER exists:", !!process.env.SMTP_USER);
  console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

  const link = `${process.env.CLIENT_URL}/verify/${token}`;
  console.log("Verification Link:", link);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Temp Cover" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Your Verification Link",
      html: emailTemplate({
        name: userName,
        link,
      }),
    });

    console.log("✅ Email sent successfully:", info.response);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }

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