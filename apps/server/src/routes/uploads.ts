import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/auth";
import { uploadBuffer } from "../services/cloudinary";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadsRouter = Router();

uploadsRouter.use(authenticate);

uploadsRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: "Missing file" });
      return;
    }

    const tenantId = req.user?.tenantId ?? "demo";
    const result = await uploadBuffer(req.file.buffer, {
      folder: `aquaflow/${tenantId}/uploads`,
      publicId: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "-")}`
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id
    });
  })
);
