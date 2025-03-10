import { Request, Response, NextFunction } from 'express';
import {
   SimulationRequestModel,
   SimulationRequest,
} from '../models/SimulationRequest'; // Import the Mongoose model
import { WeatherDataModel } from '../models/weatherData'; // Import the WeatherData model

export const simulateYield = async (
   req: Request,
   res: Response,
   next: NextFunction
) => {
   try {
      const simulationRequest = req.body;
      const { seasonId, weather_data } = simulationRequest;

      // Generate the yield calculation
      const total_apples_yielded = calculateYield(simulationRequest);

      // Create a new SimulationRequest document with weather data and total apples yielded
      const newSimulationRequest = new SimulationRequestModel({
         ...simulationRequest,
         total_apples_yielded,
      });

      // Save the simulation request in the database
      await newSimulationRequest.save();

      // Save weather data with the seasonId
      for (let weather of weather_data) {
         const newWeatherData = new WeatherDataModel({
            seasonId, // Attach the seasonId to the weather data
            ...weather,
         });

         // Save the weather data with the seasonId
         await newWeatherData.save();
      }

      // Send the response with the calculated yield
      res.status(200).json({ total_apples_yielded });
   } catch (error) {
      next(error);
   }
};

// Helper function to calculate the weather adjustment based on temperature, rainfall, and wind speed
const calculateWeatherAdjustment = (
   temperature: number,
   rainfall_mm: number,
   wind_speed_kmh: number
): number => {
   let adjustment = 1;

   // Temperature adjustment
   if (temperature < 20) {
      adjustment -= (20 - temperature) * 0.02;
   } else if (temperature > 30) {
      adjustment -= (temperature - 30) * 0.02;
   }

   // Rainfall adjustment
   if (rainfall_mm < 5) {
      adjustment -= (5 - rainfall_mm) * 0.05;
   } else if (rainfall_mm > 20) {
      adjustment -= (rainfall_mm - 20) * 0.05;
   }

   // Wind speed adjustment
   if (wind_speed_kmh > 30) {
      adjustment -= 0.1;
   }

   // Ensure adjustment doesn't go below 0
   return Math.max(0, adjustment);
};

export const calculateYield = ({
   tree_count,
   apples_per_tree,
   weather_data,
}: SimulationRequest): number => {
   let totalYield = 0;

   weather_data &&
      weather_data.forEach(({ temperature, rainfall_mm, wind_speed_kmh }) => {
         const adjustment = calculateWeatherAdjustment(
            temperature,
            rainfall_mm,
            wind_speed_kmh
         );
         totalYield += tree_count * apples_per_tree * adjustment;
      });

   return Math.round(totalYield);
};
