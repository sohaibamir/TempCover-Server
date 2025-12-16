import fs from "fs";
import path from "path";
import asyncHandler from "express-async-handler";
import { generateToken } from "../utils/tokenUtils.js";
import User from "../models/userModel.js";
import Insurance from "../models/insuranceModel.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { PDFDocument } from "pdf-lib";
import * as fontkit from "fontkit";

const STATIC_TYPES = ["contract", "wording", "productInfo", "endorsement"];

export const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;

  const count = await User.countDocuments();

  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    users,
    totalPages: Math.ceil(count / limit),
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    message: "User updated successfully",
    user,
  });
});

// Verify user insurance
export const verifyUserInsurance = asyncHandler(async (req, res) => {
  const { insuranceNo, name, dob, email } = req.body;

  const insurance = await Insurance.findOne({ insuranceNo }).populate("user");
  if (!insurance) throw new ErrorHandler("Insurance not found", 404);

  const user = insurance.user;

    console.log("Verifying insurance for:",  user );
  if (
    !user ||
    user.name !== name ||
    user.email !== email ||
    user.dob.toISOString().slice(0, 10) !== dob
  ) {
    throw new ErrorHandler("User details do not match", 400);
  }

  res.json({
    message: "Verification successful",
    insurance,
    token: generateToken(user._id),
    user,
  });
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    user,
  });
});


const formatFullDateTime = (date) => {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "");
};

export const generateCertificatePDF = async (insurance) => {
  const templatePath = path.join(process.cwd(), "public/pdf/certificate.pdf");
  const fontPath = path.join(process.cwd(), "public/fonts/DejaVuSans-Bold.ttf");

  const templateBytes = fs.readFileSync(templatePath);
  const fontBytes = fs.readFileSync(fontPath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const dejaVuBold = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.getPages()[0];

  const issue = formatFullDateTime(insurance.issueDate);
  const expiry = formatFullDateTime(insurance.expiryDate);
  const name = insurance.user?.name ?? "";
  const address = (insurance.user?.address ?? "")?.split(",")?.map(l => l.trim());
  const nameWithTitle =  insurance.user?.title + " " + insurance.user?.name ;

  const fontSize = 9.98; // pt

  page.drawText(name, { x: 38, y: 753, size: fontSize, font: dejaVuBold });
  let y = 740;
  address.forEach(line => {
  if (line) {
    page.drawText(line, { x: 38, y: y, size: fontSize, font: dejaVuBold });
    y -= 12;
  }
  });
  page.drawText(insurance.insuranceNo, { x: 384, y: 599, size: fontSize, font: dejaVuBold });
  page.drawText(insurance.registrationNo, { x: 132, y: 584, size: fontSize, font: dejaVuBold });
  page.drawText(`${insurance.makerName} ${insurance.model}`, { x: 132, y: 506, size: fontSize, font: dejaVuBold });
  page.drawText(nameWithTitle, { x: 132, y: 471, size: fontSize, font: dejaVuBold });
  page.drawText(issue, { x: 132, y: 434, size: fontSize, font: dejaVuBold });
  page.drawText(expiry, { x: 132, y: 399, size: fontSize, font: dejaVuBold });
  page.drawText(nameWithTitle, { x: 132, y: 338, size: fontSize, font: dejaVuBold });

  return await pdfDoc.save();
};

export const generateSchedulePDF = async (insurance) => {
  const templatePath = path.join(process.cwd(), "public/pdf/schedule.pdf");
  const fontPath = path.join(process.cwd(), "public/fonts/DejaVuSans.ttf");

  const templateBytes = fs.readFileSync(templatePath);
  const fontBytes = fs.readFileSync(fontPath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const dejaVuSans = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.getPages()[0];

  const issue = formatFullDateTime(insurance.issueDate);
  const expiry = formatFullDateTime(insurance.expiryDate);
  const name = insurance.user?.name ?? "";
  const occupation = insurance.user?.occupation ?? "Not required";
  const address = (insurance.user?.address ?? "")?.split(",")?.map(l => l.trim());

  const fontSize = 7.68; // pt

  page.drawText(name, { x: 135, y: 673.5, size: fontSize, font: dejaVuSans });
  let y = 654;
  page.drawText("N/A", { x: 437, y: 673.5, size: fontSize, font: dejaVuSans });
  address.forEach(line => {
  if (line) {
    page.drawText(line, { x: 135, y: y, size: fontSize, font: dejaVuSans });
    y -= 10;
  }
  });
  page.drawText(occupation, { x: 135, y: 603, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.insuranceNo, { x: 135, y: 583, size: fontSize, font: dejaVuSans });
  page.drawText(issue, { x: 135, y: 563, size: fontSize, font: dejaVuSans });
  page.drawText(expiry, { x: 437, y: 563, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.makerName, { x: 76, y: 522, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.model, { x: 268, y: 522, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.vehicleValue, { x: 128, y: 461, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.registrationNo, { x: 486, y: 461, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.policyCover, { x: 128, y: 427, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.premium, { x: 128, y: 339, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.premium, { x: 410, y: 339, size: fontSize, font: dejaVuSans });

  return await pdfDoc.save();
};

export const generateStatementPDF = async (insurance) => {
  const templatePath = path.join(process.cwd(), "public/pdf/statement.pdf");
  const fontPath = path.join(process.cwd(), "public/fonts/DejaVuSans.ttf");

  const templateBytes = fs.readFileSync(templatePath);
  const fontBytes = fs.readFileSync(fontPath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const dejaVuSans = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.getPages()[0];

  const dob = new Date(insurance.user?.dob).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' });

  const issue = formatFullDateTime(insurance.issueDate);
  const expiry = formatFullDateTime(insurance.expiryDate);
  const nameParts = insurance.user?.name?.split(" ").filter(Boolean);
  const forname = nameParts[0] ?? "";
  const phoneNo = insurance.user?.phoneNo ?? "";
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
  const gender =  insurance.user?.title == "Ms" ? "Female" : "Male" ;
  const occupation = insurance.user?.occupation ?? "Not required";

  const fontSize = 7.68; // pt

  page.drawText(surname, { x: 223, y: 605, size: fontSize, font: dejaVuSans });
  page.drawText(forname, { x: 223, y: 592, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.user?.title, { x: 223, y: 579, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.user?.address, { x: 223, y: 566, size: fontSize, font: dejaVuSans });
  page.drawText(phoneNo, { x: 223, y: 553, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.user?.email, { x: 223, y: 540, size: fontSize, font: dejaVuSans });
  page.drawText(issue, { x: 223, y: 512, size: fontSize, font: dejaVuSans });
  page.drawText(expiry, { x: 223, y: 499, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.policyCover?.toUpperCase(), { x: 223, y: 486, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.user?.name, { x: 148, y: 397, size: fontSize, font: dejaVuSans });
  page.drawText(gender, { x: 148, y: 384, size: fontSize, font: dejaVuSans });
  page.drawText(dob, { x: 148, y: 371, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.licenseType, { x: 148, y: 358, size: fontSize, font: dejaVuSans });
  page.drawText(occupation, { x: 148, y: 345, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.makerName, { x: 219, y: 317, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.model, { x: 219, y: 304, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.registrationNo, { x: 219, y: 291, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.vehicleValue, { x: 219, y: 278, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.user?.name, { x: 148, y: 249, size: fontSize, font: dejaVuSans });
  page.drawText(insurance.user?.name, { x: 148, y: 174, size: fontSize, font: dejaVuSans });


  return await pdfDoc.save();
};

const PDF_GENERATORS = {
  certificate: generateCertificatePDF,
  statement: generateStatementPDF,
  schedule: generateSchedulePDF,
};

// Generate PDF based on type
export const generatePDF = asyncHandler(async (req, res) => {
  const { insuranceId, type } = req.params;
  console.log("Received request to generate PDF:", { insuranceId, type });

  if (STATIC_TYPES.includes(type)) {
    const filename = `${type}.pdf`;
    const filePath = path.join(process.cwd(), "public/pdf", filename);

    return res.download(filePath, filename, (err) => {
      if (err) {
        return res.status(404).json({ message: "File not found" });
      }
    });
  }

  const insurance = await Insurance.findById(insuranceId).populate("user");
  if (!insurance)
    throw new ErrorHandler("Insurance not found for the user", 404);

  const generator = PDF_GENERATORS[type];
  if (!generator) {
    return res.status(400).json({ message: `PDF type '${type}' not supported` });
  }

  const pdfBytes = await generator(insurance);
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
  `attachment; filename=${type}-${insurance.insuranceNo}.pdf`
  );

  return res.send(Buffer.from(pdfBytes));
});
