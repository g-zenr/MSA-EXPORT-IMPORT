"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExportData = void 0;
const joi_1 = __importDefault(require("joi"));
const exportSchema = joi_1.default.object({
    data: joi_1.default.array().items(joi_1.default.object()).min(1).max(1000000).required(),
    config: joi_1.default.object({
        filename: joi_1.default.string()
            .max(255)
            .pattern(/^[a-zA-Z0-9_-]+$/)
            .optional(),
        headers: joi_1.default.array().items(joi_1.default.string()).optional(),
        title: joi_1.default.string().max(255).optional(),
        fields: joi_1.default.array().items(joi_1.default.string()).optional(),
        includeHeader: joi_1.default.boolean().optional(),
        delimiter: joi_1.default.string().max(1).optional(),
        width: joi_1.default.number().min(100).max(5000).optional(),
        height: joi_1.default.number().min(100).max(5000).optional(),
        backgroundColor: joi_1.default.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
        format: joi_1.default.string().valid("png", "jpg", "jpeg").optional(),
        quality: joi_1.default.number().min(0.1).max(1.0).optional(),
        pageSize: joi_1.default.string().valid("A4", "A3", "Letter", "Legal").optional(),
        margin: joi_1.default.number().min(0).max(100).optional(),
    }).optional(),
});
const validateExportData = (req, res, next) => {
    const { error, value } = exportSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        cache: true,
    });
    if (error) {
        const details = error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
        }));
        res.status(400).json({
            error: "Validation failed",
            details,
        });
        return;
    }
    req.body = value;
    next();
};
exports.validateExportData = validateExportData;
