import { Request, Response, NextFunction } from 'express';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // In production, validate API key
  const validApiKey = process.env.BIZNEAI_API_KEY;
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key'
    });
  }

  next();
}; 