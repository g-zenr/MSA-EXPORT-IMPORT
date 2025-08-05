import express from "express";
import rateLimit from "express-rate-limit";
import exportController from "../controllers/exportController";
import { validateExportData } from "../middleware/validation";

const router = express.Router();

const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many export requests, please try again later",
});

router.use(exportLimiter);

router.post("/", validateExportData, exportController.exportToCsv);
router.post("/csv", validateExportData, exportController.exportToCsv);
router.post("/pdf", validateExportData, exportController.exportToPdf);
router.post("/image", validateExportData, exportController.exportToImage);

export default router;
