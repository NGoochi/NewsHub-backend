import multer from 'multer';

// Configure multer for PDF uploads
export const pdfUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

