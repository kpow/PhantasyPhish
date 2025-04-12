import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    // Generate a unique filename with original extension
    const extension = path.extname(file.originalname);
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}${extension}`);
  },
});

// File filter to accept only image files
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter,
});

// Get public URL for avatar
export function getAvatarUrl(filename: string): string {
  return `/uploads/${filename}`;
}

// Delete avatar file
export function deleteAvatar(filepath: string): Promise<void> {
  // Remove the leading slash and 'uploads' from the path
  const relativeFilepath = filepath.replace(/^\/uploads\//, "");
  const absoluteFilepath = path.join(uploadsDir, relativeFilepath);

  return new Promise((resolve, reject) => {
    fs.unlink(absoluteFilepath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}