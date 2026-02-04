import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directories exist
const uploadBase = path.join(process.cwd(), 'uploads');
const uploadDirs = ['avatars', 'receipts', 'documents'];

uploadDirs.forEach(dir => {
    const dirPath = path.join(uploadBase, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'documents';

        // Determine folder based on fieldname
        if (file.fieldname === 'avatar') {
            folder = 'avatars';
        } else if (file.fieldname === 'receipt') {
            folder = 'receipts';
        } else if (file.fieldname === 'productImage') {
            folder = 'products';
        }

        const uploadPath = path.join(uploadBase, folder);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept images only
    if (file.fieldname === 'avatar' || file.fieldname === 'productImage') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for avatars and products'));
        }
    } else if (file.fieldname === 'receipt') {
        // Accept images and PDFs for receipts
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image files and PDFs are allowed for receipts'));
        }
    } else {
        // Accept various document types
        const allowedMimes = [
            'image/',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedMimes.some(mime => file.mimetype.startsWith(mime))) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
};

// Create multer upload instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
    upload.array(fieldName, maxCount);

// Middleware for multiple fields
export const uploadFields = (fields: Array<{ name: string; maxCount?: number }>) =>
    upload.fields(fields);

// Helper function to delete a file
export const deleteUploadedFile = (filePath: string): boolean => {
    try {
        const fullPath = path.join(uploadBase, filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

// Helper function to get file URL
export const getFileUrl = (filename: string, category: string): string => {
    return `/uploads/${category}/${filename}`;
};
