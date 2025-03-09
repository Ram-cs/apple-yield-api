import { Request, Response } from 'express';
import { WeatherDataModel } from '../models/weatherData'; // Import WeatherData model

export const getOptimalPlantingTime = async (req: Request, res: Response) => {
   try {
      // Aggregate and analyze weather data for optimal planting conditions
      const weatherData = await WeatherDataModel.aggregate([
         {
            $group: {
               _id: '$seasonId',
               avgTemperature: { $avg: '$temperature' },
               avgRainfall: { $avg: '$rainfall_mm' },
               maxWindSpeed: { $max: '$wind_speed_kmh' },
            },
         },
         {
            $match: {
               avgTemperature: { $gte: 20, $lte: 30 },
               avgRainfall: { $gte: 5, $lte: 20 },
               maxWindSpeed: { $lte: 30 },
            },
         },
         { $sort: { avgTemperature: 1 } }, // Sort by temperature for optimal planting
      ]);

      if (weatherData.length === 0) {
         res.status(404).json({ message: 'No optimal planting times found.' });
         return;
      }

      // Filter seasons that meet the optimal planting conditions:
      // - Temperature between 20°C and 30°C
      // - Rainfall between 5mm and 20mm
      // - Low wind speed (below 30 km/h)
      res.json({
         optimalSeasons: weatherData,
         totalSeasonsAnalyzed: weatherData.length,
         criteria: {
            temperatureRange: '20°C to 30°C',
            rainfallRange: '5mm to 20mm',
            maxWindSpeedThreshold: '<= 30 km/h',
         },
      });
   } catch (error) {
      res.status(500).json({
         message:
            'Failed to retrieve optimal planting times. Please try again later.',
         error:
            error instanceof Error ? error.message : 'Unknown error occurred',
      });
   }
};
