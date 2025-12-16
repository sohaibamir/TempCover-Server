import jwt from "jsonwebtoken";

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

export const generateLinkToken = (insuranceId, userId) => {
  return jwt.sign(
    { insuranceId, userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};