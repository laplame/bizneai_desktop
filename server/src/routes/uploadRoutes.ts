import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload directories exist
const createUploadDirectories = () => {
  const uploadDirs = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads/images'),
    path.join(__dirname, '../../uploads/products'),
    path.join(__dirname, '../../public/images')
  ];
  
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirectories();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dual storage: private + public
    const publicDir = path.join(__dirname, '../../public/images');
    const privateDir = path.join(__dirname, '../../uploads/products');
    cb(null, privateDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload schemas
const uploadImageSchema = z.object({
  folder: z.string().default('images'),
  uploadType: z.enum(['both', 'cloudinary', 'local']).default('both')
});

const uploadImagesSchema = z.object({
  folder: z.string().default('images'),
  uploadType: z.enum(['both', 'cloudinary', 'local']).default('both')
});

// Mock Cloudinary service (in real implementation, this would use the actual Cloudinary SDK)
class MockCloudinaryService {
  async uploadImage(filePath: string, folder: string, options: any = {}) {
    // Simulate Cloudinary upload
    const publicId = `${folder}/${path.basename(filePath, path.extname(filePath))}`;
    const cloudinaryUrl = `https://res.cloudinary.com/mock-cloud/image/upload/v1234567890/${publicId}.jpg`;
    
    return {
      url: cloudinaryUrl,
      publicId,
      secureUrl: cloudinaryUrl,
      format: 'jpg',
      width: 800,
      height: 600,
      resourceType: 'image'
    };
  }

  async uploadMultipleImages(filePaths: string[], folder: string, options: any = {}) {
    const results = [];
    for (const filePath of filePaths) {
      const result = await this.uploadImage(filePath, folder, options);
      results.push(result);
    }
    return results;
  }

  getOptimizedUrl(publicId: string, options: any = {}) {
    const { width = 800, height = 600, quality = 80, format = 'auto' } = options;
    return `https://res.cloudinary.com/mock-cloud/image/upload/c_scale,w_${width},h_${height},q_${quality},f_${format}/${publicId}.jpg`;
  }

  getProductCardUrl(publicId: string, options: any = {}) {
    return this.getOptimizedUrl(publicId, { width: 300, height: 300, quality: 85 });
  }

  getResponsiveUrls(publicId: string) {
    return {
      sm: this.getOptimizedUrl(publicId, { width: 400, height: 300 }),
      md: this.getOptimizedUrl(publicId, { width: 600, height: 450 }),
      lg: this.getOptimizedUrl(publicId, { width: 800, height: 600 }),
      xl: this.getOptimizedUrl(publicId, { width: 1200, height: 900 })
    };
  }
}

const cloudinaryService = new MockCloudinaryService();

// 1. Upload Single Image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    const query = uploadImageSchema.parse(req.query);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded'
      });
    }

    const file = req.file;
    const localUrl = `/uploads/products/${file.filename}`;
    let cloudinaryUrl = null;
    let publicId = null;

    // Upload to Cloudinary if requested
    if (query.uploadType === 'both' || query.uploadType === 'cloudinary') {
      try {
        const cloudinaryResult = await cloudinaryService.uploadImage(
          file.path, 
          query.folder, 
          {
            generateThumbnail: true,
            generateWebp: true,
            quality: 80,
            maxWidth: 1200,
            maxHeight: 900
          }
        );
        cloudinaryUrl = cloudinaryResult.url;
        publicId = cloudinaryResult.publicId;
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
        // Continue with local upload only
      }
    }

    // Clean up temporary file if only Cloudinary was requested
    if (query.uploadType === 'cloudinary' && cloudinaryUrl) {
      fs.unlinkSync(file.path);
    }

    res.json({
      success: true,
      data: {
        localUrl: query.uploadType !== 'cloudinary' ? localUrl : null,
        cloudinaryUrl: cloudinaryUrl,
        publicId: publicId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// 2. Upload Multiple Images
router.post('/images', upload.array('images', 5), async (req, res) => {
  try {
    const query = uploadImagesSchema.parse(req.query);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images uploaded'
      });
    }

    const files = req.files as Express.Multer.File[];
    const results = [];

    for (const file of files) {
      const localUrl = `/uploads/products/${file.filename}`;
      let cloudinaryUrl = null;
      let publicId = null;

      // Upload to Cloudinary if requested
      if (query.uploadType === 'both' || query.uploadType === 'cloudinary') {
        try {
          const cloudinaryResult = await cloudinaryService.uploadImage(
            file.path, 
            query.folder, 
            {
              generateThumbnail: true,
              generateWebp: true,
              quality: 80,
              maxWidth: 1200,
              maxHeight: 900
            }
          );
          cloudinaryUrl = cloudinaryResult.url;
          publicId = cloudinaryResult.publicId;
        } catch (error) {
          console.error('Cloudinary upload failed for file:', file.filename, error);
          // Continue with local upload only
        }
      }

      results.push({
        localUrl: query.uploadType !== 'cloudinary' ? localUrl : null,
        cloudinaryUrl: cloudinaryUrl,
        publicId: publicId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
    }

    // Clean up temporary files if only Cloudinary was requested
    if (query.uploadType === 'cloudinary') {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.json({
      success: true,
      data: {
        urls: results.map(r => r.cloudinaryUrl || r.localUrl).filter(Boolean),
        publicIds: results.map(r => r.publicId).filter(Boolean),
        files: results
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    // Clean up uploaded files on error
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
});

// 3. Get Optimized Image URLs
router.get('/optimize/:publicId', async (req, res) => {
  try {
    const { publicId } = z.object({ publicId: z.string() }).parse(req.params);
    const { width, height, quality, format } = req.query;

    const options = {
      width: width ? parseInt(width as string) : 800,
      height: height ? parseInt(height as string) : 600,
      quality: quality ? parseInt(quality as string) : 80,
      format: format as string || 'auto'
    };

    const optimizedUrl = cloudinaryService.getOptimizedUrl(publicId, options);
    const responsiveUrls = cloudinaryService.getResponsiveUrls(publicId);
    const productCardUrl = cloudinaryService.getProductCardUrl(publicId);

    res.json({
      success: true,
      data: {
        optimizedUrl,
        responsiveUrls,
        productCardUrl,
        options
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimized URLs'
    });
  }
});

// 4. Delete Image
router.delete('/image/:filename', async (req, res) => {
  try {
    const { filename } = z.object({ filename: z.string() }).parse(req.params);
    
    const filePath = path.join(__dirname, '../../uploads/products', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

// 5. Test Upload Endpoint
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Upload API is working correctly',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Single image upload',
      'Multiple image upload',
      'Cloudinary integration',
      'Image optimization',
      'Responsive URLs',
      'File validation'
    ]
  });
});

export default router; 