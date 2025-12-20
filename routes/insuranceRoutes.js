import express from "express";
import { getInsurances, getInsuranceDetails, generateInsuranceNo, addInsuranceWithUser, updateInsurance } from "../controllers/insuranceController.js";
import { auth } from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get("/insurance/get-insurances", auth, getInsurances);
router.get("/insurance/details/:insuranceNo", auth, getInsuranceDetails);
router.get("/insurance/generate-insurance-no", auth, generateInsuranceNo);
router.post("/insurance/create-insurance", auth, upload.array("files"), addInsuranceWithUser);
router.put("/insurance/edit-insurance/:insuranceNo", auth, updateInsurance);

export default router;
