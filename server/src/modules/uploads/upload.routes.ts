import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { ApiError } from '../../utils/ApiError';
import { Attachment } from './attachment.model';

const router = Router();

/**
 * Only document and image types are accepted. The stored extension comes from this
 * table, never from the uploaded file name, so an "invoice.pdf.html" cannot be saved
 * as HTML and run scripts when opened.
 */
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};

export const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      cb(null, UPLOADS_DIR);
    } catch (err) {
      cb(new ApiError(500, 'File storage is not available on this server') as any, UPLOADS_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || '';
    cb(null, `file-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB, one file per request
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
    cb(new ApiError(400, 'This file type is not allowed. Upload images, PDF, Office documents, text, CSV or ZIP files.', 'FILE_TYPE_NOT_ALLOWED') as any);
  },
});

/** Public base URL for uploaded files. API_PUBLIC_URL avoids trusting the Host header. */
const getPublicBaseUrl = (req: Request) =>
  (process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

router.post('/', authMiddleware, (req: Request, res: Response, next) => {
  upload.single('file')(req, res, async (uploadError: any) => {
    try {
      if (uploadError) {
        if (uploadError instanceof ApiError) throw uploadError;
        if (uploadError?.code === 'LIMIT_FILE_SIZE') throw new ApiError(400, 'File is too large. The limit is 10MB.', 'FILE_TOO_LARGE');
        throw new ApiError(400, uploadError?.message || 'Upload failed');
      }
      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const user = (req as any).user;
      const attachment = await Attachment.create({
        name: path.basename(req.file.originalname).slice(0, 255),
        url: `${getPublicBaseUrl(req)}/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploadedBy: user._id || user.id,
      });

      res.status(201).json({
        success: true,
        data: attachment,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  });
});

export default router;
