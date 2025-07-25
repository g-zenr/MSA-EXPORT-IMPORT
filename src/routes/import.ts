import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import importController from "../controllers/importController";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1,
    fieldNameSize: 255,
    fieldSize: 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv") ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

const importLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "Too many import requests, please try again later",
});

router.use(importLimiter);
router.post("/csv", upload.single("file"), importController.importFromCsv);

export default router;
