import asyncHandler from "express-async-handler";
import Insurance from "../models/insuranceModel.js";
import User from "../models/userModel.js";
import cloudinary from "../utils/cloudinary.js";

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "insurances" },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

export const addInsuranceWithUser = asyncHandler(async (req, res) => {
  const {
    insuranceNo,
    model,
    registrationNo,
    makerName,
    policyCover,
    premium,
    vehicleValue,
    issueDate,
    expiryDate,
    licenseType,
    title,
    name,
    email,
    dob,
    address, 
    phoneNo,
    occupation,
  } = req.body;

console.log("Request Body:", req.body);

  const exists = await Insurance.findOne({ insuranceNo });
  if (exists) {
    res.status(400);
    throw new Error("Insurance number already exists");
  }

  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    uploadedImages = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );
  }

  console.log("Uploaded Images:", uploadedImages);

  // Create user if not exists
  let newUser = await User.findOne({ email: email });
  if (!newUser) {
    newUser = await User.create({ title, name, email, dob, address, phoneNo, occupation, insuranceNo });
  }

  const insurance = await Insurance.create({
    insuranceNo,
    model,
    registrationNo,
    makerName,
    policyCover,
    premium,
    licenseType,
    vehicleValue,
    issueDate,
    expiryDate,
    images: uploadedImages,
    user: newUser._id,
  });

  res.status(201).json({
    message: `${insurance?.insuranceNo} created successfully!`,
    insurance,
    user: newUser,
  });
});

export const getInsurances = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;

  const count = await Insurance.countDocuments();

  const insurances = await Insurance.find()
    .select("-images")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    insurances,
    totalPages: Math.ceil(count / limit),
  });
});

export const getInsuranceDetails = asyncHandler(async (req, res) => {
  const { insuranceNo } = req.params;
  const insurance = await Insurance.findOne({ insuranceNo });

  if (!insurance) {
    res.status(404);
    throw new Error("Insurance not found");
  }

  res.json({
    insurance,
  });
});

export const updateInsurance = asyncHandler(async (req, res) => {
  const { insuranceNo } = req.params;
  const insurance = await Insurance.findOne({ insuranceNo });

  if (!insurance) {
    res.status(404);
    throw new Error("Insurance not found");
  }

  Object.keys(req.body).forEach((key) => {
    insurance[key] = req.body[key];
  });

  const updatedInsurance = await insurance.save();

  res.json({
    message: "Insurance updated successfully",
    insurance: updatedInsurance,
  });
});

export const generateInsuranceNo = asyncHandler(async (req, res) => {
  const generateRandomInsuranceNo = () => {
    const prefix = "TCV-MOT-";
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
    return `${prefix}${randomDigits}`;
  };

  let insuranceNo;
  let exists;

  do {
    insuranceNo = generateRandomInsuranceNo();
    exists = await Insurance.findOne({ insuranceNo });
  } while (exists);

  res.status(200).json({ insuranceNo });
});
