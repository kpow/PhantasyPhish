import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Create unique filename: timestamp + original extension
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter - only allow images
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only image files are allowed!"));
  }
  cb(null, true);
};

// Upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB max file size
  },
  fileFilter,
});

// Helper function to get public URL for an avatar
export function getAvatarUrl(filename: string): string {
  return `/uploads/avatars/${filename}`;
}

// Helper function to delete an avatar file
export function deleteAvatar(filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filepath = path.join(uploadsDir, path.basename(filename));
    fs.unlink(filepath, (err) => {
      if (err) {
        // If file doesn't exist, consider it successful
        if (err.code === 'ENOENT') {
          return resolve();
        }
        return reject(err);
      }
      resolve();
    });
  });
}