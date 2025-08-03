import express from 'express';
import uploadRoutes from './uploadRoutes';

const router = express.Router();

// Mount upload routes
router.use('/upload', uploadRoutes);

// Image optimization endpoints
router.get('/optimize/:publicId', async (req, res) => {
  // This would be handled by the upload routes
  res.redirect(`/api/upload/optimize/${req.params.publicId}`);
});

export default router; 