import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { ApiError } from '../../utils/ApiError';
import { Attachment } from './attachment.model';

const router = Router();

// Configure local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File validation
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// Upload endpoint
router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const user = (req as any).user;
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      const attachment = await Attachment.create({
        name: req.file.originalname,
        url: fileUrl,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploadedBy: user._id || user.id
      });
      
      res.status(201).json({
        success: true,
        data: attachment,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
