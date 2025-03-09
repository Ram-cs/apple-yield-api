import { Request, Response, NextFunction } from 'express';
import { SimulationRequest } from '../models/SimulationRequest';

// Middleware to validate the request body
export const validateSimulationRequest = (
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   const {
      apples_per_tree,
      season_length_days,
      tree_count,
      weather_data,
   }: SimulationRequest = req.body;

   if (
      !apples_per_tree ||
      apples_per_tree <= 0 ||
      !season_length_days ||
      season_length_days <= 0 ||
      !tree_count ||
      tree_count <= 0 ||
      !Array.isArray(weather_data) ||
      weather_data.length === 0
   ) {
      // Create a custom error object with statusCode 400
      const error = new Error('Bad Request');
      (error as any).statusCode = 400;
      return next(error);
   }

   next(); // `next()` is always called for valid requests
};
