import express from "express";
import { createAdmin, loginAdmin, sendInsuranceLink, getAdmins, updatePassword } from "../controllers/adminController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/admin/create", auth, createAdmin);
router.get("/admin/get-admins", auth, getAdmins);
router.post("/admin/login", loginAdmin);
router.post("/admin/send-email/:insuranceNo", auth, sendInsuranceLink);
router.put("/admin/update/:adminId", updatePassword);

export default router;