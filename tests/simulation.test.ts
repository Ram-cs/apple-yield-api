import { Request, Response } from 'express';
import { getOptimalPlantingTime } from '../src/controllers/optimalPlantingController';
import { WeatherDataModel } from '../src/models/weatherData';

jest.mock('../src/models/weatherData');

describe('Get Optimal Planting Time', () => {
   let mockRequest: Partial<Request>;
   let mockResponse: Partial<Response>;

   beforeEach(() => {
      mockRequest = {};
      mockResponse = {
         status: jest.fn().mockReturnThis(),
         json: jest.fn(),
      };
      jest.clearAllMocks();
   });

   test('Optimal planting times found', async () => {
      const mockWeatherData = [
         {
            _id: 'spring2023',
            avgTemperature: 25,
            avgRainfall: 10,
            maxWindSpeed: 20,
         },
         {
            _id: 'fall2023',
            avgTemperature: 22,
            avgRainfall: 15,
            maxWindSpeed: 25,
         },
      ];

      (WeatherDataModel.aggregate as jest.Mock).mockResolvedValue(
         mockWeatherData
      );

      await getOptimalPlantingTime(
         mockRequest as Request,
         mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
         optimalSeasons: mockWeatherData,
         totalSeasonsAnalyzed: 2,
         criteria: {
            temperatureRange: '20°C to 30°C',
            rainfallRange: '5mm to 20mm',
            maxWindSpeedThreshold: '<= 30 km/h',
         },
      });
   });

   test('No optimal planting times found', async () => {
      (WeatherDataModel.aggregate as jest.Mock).mockResolvedValue([]);

      await getOptimalPlantingTime(
         mockRequest as Request,
         mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
         message: 'No optimal planting times found.',
      });
   });

   test('Database error', async () => {
      const mockError = new Error('Database connection failed');
      (WeatherDataModel.aggregate as jest.Mock).mockRejectedValue(mockError);

      await getOptimalPlantingTime(
         mockRequest as Request,
         mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
         message:
            'Failed to retrieve optimal planting times. Please try again later.',
         error: 'Database connection failed',
      });
   });

   test('Edge case: Exactly at temperature limits', async () => {
      const mockWeatherData = [
         {
            _id: 'summer2023',
            avgTemperature: 20,
            avgRainfall: 10,
            maxWindSpeed: 25,
         },
         {
            _id: 'winter2023',
            avgTemperature: 30,
            avgRainfall: 15,
            maxWindSpeed: 20,
         },
      ];

      (WeatherDataModel.aggregate as jest.Mock).mockResolvedValue(
         mockWeatherData
      );

      await getOptimalPlantingTime(
         mockRequest as Request,
         mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
         expect.objectContaining({
            optimalSeasons: mockWeatherData,
            totalSeasonsAnalyzed: 2,
         })
      );
   });

   test('Edge case: Exactly at rainfall limits', async () => {
      const mockWeatherData = [
         {
            _id: 'spring2024',
            avgTemperature: 25,
            avgRainfall: 5,
            maxWindSpeed: 25,
         },
         {
            _id: 'fall2024',
            avgTemperature: 22,
            avgRainfall: 20,
            maxWindSpeed: 20,
         },
      ];

      (WeatherDataModel.aggregate as jest.Mock).mockResolvedValue(
         mockWeatherData
      );

      await getOptimalPlantingTime(
         mockRequest as Request,
         mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
         expect.objectContaining({
            optimalSeasons: mockWeatherData,
            totalSeasonsAnalyzed: 2,
         })
      );
   });

   test('Edge case: Exactly at wind speed limit', async () => {
      const mockWeatherData = [
         {
            _id: 'summer2024',
            avgTemperature: 25,
            avgRainfall: 10,
            maxWindSpeed: 30,
         },
      ];

      (WeatherDataModel.aggregate as jest.Mock).mockResolvedValue(
         mockWeatherData
      );

      await getOptimalPlantingTime(
         mockRequest as Request,
         mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
         expect.objectContaining({
            optimalSeasons: mockWeatherData,
            totalSeasonsAnalyzed: 1,
         })
      );
   });
});
