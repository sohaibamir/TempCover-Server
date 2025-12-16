import express from "express";
import { verifyUserInsurance, getUsers, generatePDF, getUserDetails, updateUser } from "../controllers/userController.js";
import { auth, userLinkAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/user/get-users", auth, getUsers);
router.get("/user/details/:userId", auth, getUserDetails);
router.get("/user/pdf/:insuranceId/:type", generatePDF);
router.post("/user/verify/:token", userLinkAuth, verifyUserInsurance);
router.put("/user/edit-user/:userId", auth, updateUser);

export default router;