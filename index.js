import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import adminRoute from "./routes/adminRoutes.js";
import userRoute from "./routes/userRoutes.js";
import insuranceRoute from "./routes/insuranceRoutes.js";

dotenv.config({ path: "./.env" });

const app = express();

const connect = () => {
  mongoose
    .connect(process.env.MONGOOSE_URI)
    .then(() => console.log("Connected to DB"))
    .catch((error) => console.log(`DB CONNECTION ERR ${error}`));
};

app.use(express.json({ limit: "500mb" }));
app.use(cors({ origin: "*" }));

app.use("/api", adminRoute);
app.use("/api", userRoute);
app.use("/api", insuranceRoute);

app.use("/static", express.static(path.join(process.cwd(), "public")));

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message,
    stack: null
  });
});

app.listen(process.env.PORT, () => {
  connect();
  console.log(`App is running on port ${process.env.PORT}`);
});
