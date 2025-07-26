"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const importController_1 = __importDefault(require("../controllers/importController"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 1,
        fieldNameSize: 255,
        fieldSize: 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv" ||
            file.originalname.toLowerCase().endsWith(".csv") ||
            file.mimetype === "application/vnd.ms-excel") {
            cb(null, true);
        }
        else {
            cb(new Error("Only CSV files are allowed"));
        }
    },
});
const importLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 50,
    message: "Too many import requests, please try again later",
});
router.use(importLimiter);
router.post("/csv", upload.single("file"), importController_1.default.importFromCsv);
exports.default = router;
