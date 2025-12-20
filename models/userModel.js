import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  phoneNo: { type: String, required: true },
  occupation: { type: String },
  role: { type: String, default: "user" },
});

export default mongoose.model("User", userSchema);