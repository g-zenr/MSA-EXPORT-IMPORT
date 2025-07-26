"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const exportController_1 = __importDefault(require("../controllers/exportController"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const exportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: "Too many export requests, please try again later",
});
router.use(exportLimiter);
router.post("/csv", validation_1.validateExportData, exportController_1.default.exportToCsv);
router.post("/pdf", validation_1.validateExportData, exportController_1.default.exportToPdf);
router.post("/image", validation_1.validateExportData, exportController_1.default.exportToImage);
exports.default = router;
