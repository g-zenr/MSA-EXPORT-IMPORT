import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const exportSchema = Joi.object({
  data: Joi.array().items(Joi.object()).min(1).max(1000000).required(),
  config: Joi.object({
    filename: Joi.string()
      .max(255)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .optional(),
    headers: Joi.array().items(Joi.string()).optional(),
    title: Joi.string().max(255).optional(),
    fields: Joi.array().items(Joi.string()).optional(),
    includeHeader: Joi.boolean().optional(),
    delimiter: Joi.string().max(1).optional(),
    width: Joi.number().min(100).max(5000).optional(),
    height: Joi.number().min(100).max(5000).optional(),
    backgroundColor: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    format: Joi.string().valid("png", "jpg", "jpeg").optional(),
    quality: Joi.number().min(0.1).max(1.0).optional(),
    pageSize: Joi.string().valid("A4", "A3", "Letter", "Legal").optional(),
    margin: Joi.number().min(0).max(100).optional(),
  }).optional(),
});

export const validateExportData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
