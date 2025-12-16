import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/adminModel.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";

export const auth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = await Admin.findById(decoded.id).select("-password");
    if (!req.admin) {
      res.status(401);
      throw new ErrorHandler("Not authorized, admin not found");
    }

    return next();
  }

  res.status(401);
  throw new ErrorHandler("Not authorized, no token");
});

export const userLinkAuth = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    res.status(401);
    throw new ErrorHandler("Not authorized, no token");
  }

  try {
    req.linkDecoded = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401);
    throw new ErrorHandler("Link expired or invalid");
  }
});