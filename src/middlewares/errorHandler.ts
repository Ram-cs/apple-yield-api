import { Request, Response, NextFunction } from 'express';

// Centralized error handling middleware
export const errorHandler = (
   err: any,
   req: Request,
   res: Response,
   next: NextFunction
) => {
   console.error(err.stack); // Log error for debugging

   // If the error has a statusCode, use it, otherwise default to 500
   const statusCode = err.statusCode || 500;

   // Send the appropriate response based on error status code
   res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
   });
};
