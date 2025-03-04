import multer, { FileFilterCallback } from "multer";
import path from "path";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).array("images", 10);

const convertImagesToWebP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const promises = req.files.map(async (file: Express.Multer.File) => {
      const webpBuffer = await sharp(file.buffer).webp().toBuffer();
      file.buffer = webpBuffer;
      file.mimetype = "image/webp";
      file.originalname = path.parse(file.originalname).name + ".webp";
    });

    await Promise.all(promises);
    next();
  } catch (err) {
    next(err);
  }
};

export { upload, convertImagesToWebP };
