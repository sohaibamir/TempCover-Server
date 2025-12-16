import mongoose from "mongoose";

const insuranceSchema = new mongoose.Schema({
  insuranceNo: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  registrationNo: { type: String, required: true },
  makerName: { type: String, required: true },
  policyCover: { type: String, required: true },
  licenseType: { type: String, required: true },
  premium: { type: String, required: true },
  vehicleValue: { type: String, required: true },    
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  images: [{
      url: { type: String, required: true },
      public_id: { type: String, required: true },
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

export default mongoose.model("Insurance", insuranceSchema);
