import { Request, Response, NextFunction } from 'express';
import { getOptimalPlantingTime } from '../src/controllers/optimalPlantingController';
import { WeatherDataModel } from '../src/models/weatherData';
import {
   simulateYield,
   calculateYield,
} from '../src/controllers/simulationController'; // Path to your controller
import {
   SimulationRequestModel,
   SimulationRequest,
} from '../src/models/SimulationRequest';

jest.mock('../src/models/weatherData');
jest.mock('../src/models/SimulationRequest');
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

describe('simulateYield', () => {
   let mockRequest: Partial<Request>;
   let mockResponse: Partial<Response>;
   let mockNext: NextFunction;

   beforeEach(() => {
      mockRequest = {};
      mockResponse = {
         status: jest.fn().mockReturnThis(),
         json: jest.fn(),
      };
      mockNext = jest.fn();

      jest.clearAllMocks();
   });

   it('should calculate yield, save data, and return the total yield', async () => {
      // Mock request body
      const simulationRequest = {
         seasonId: 'spring2023',
         tree_count: 100,
         apples_per_tree: 10,
         weather_data: [
            { temperature: 25, rainfall_mm: 10, wind_speed_kmh: 20 },
            { temperature: 22, rainfall_mm: 15, wind_speed_kmh: 25 },
         ],
      } as SimulationRequest;
      mockRequest.body = simulationRequest;

      // Mock Mongoose models with explicit casting
      const saveMock = jest.fn().mockResolvedValue({});

      (SimulationRequestModel as unknown as jest.Mock).mockImplementation(
         () => ({
            save: saveMock,
         })
      );

      (WeatherDataModel as unknown as jest.Mock).mockImplementation(() => ({
         save: saveMock,
      }));

      // Call the function
      await simulateYield(
         mockRequest as Request,
         mockResponse as Response,
         mockNext
      );

      // Use the imported calculateYield function to compute expectedTotalYield
      const expectedTotalYield = calculateYield(simulationRequest);

      // Verify SimulationRequestModel was called with the correct data
      expect(SimulationRequestModel).toHaveBeenCalledWith({
         ...simulationRequest,
         total_apples_yielded: expectedTotalYield,
      });

      // Verify saveMock was called three times:
      // - Once for SimulationRequestModel.save()
      // - Twice for WeatherDataModel.save() (one for each weather entry)
      expect(saveMock).toHaveBeenCalledTimes(3);

      // Verify response contains the correct yield
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
         total_apples_yielded: expectedTotalYield,
      });
   });

   it('should call next with an error if something goes wrong', async () => {
      const error = new Error('Something went wrong');

      const simulationRequest = {
         seasonId: 'spring2023',
         tree_count: 100,
         apples_per_tree: 10,
         weather_data: [
            { temperature: 25, rainfall_mm: 10, wind_speed_kmh: 20 },
            { temperature: 22, rainfall_mm: 15, wind_speed_kmh: 25 },
         ],
      };

      mockRequest.body = simulationRequest;

      (SimulationRequestModel as unknown as jest.Mock).mockImplementation(
         () => ({
            save: jest.fn().mockRejectedValue(error),
         })
      );

      await simulateYield(
         mockRequest as Request,
         mockResponse as Response,
         mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
   });

   it('should handle large datasets efficiently', async () => {
      // Mock request body with a large weather_data array
      const largeWeatherData = Array.from({ length: 1000 }, (_, i) => ({
         temperature: 25 + (i % 5),
         rainfall_mm: 10 + (i % 10),
         wind_speed_kmh: 20 + (i % 15),
      }));

      const simulationRequest = {
         seasonId: 'spring2023',
         tree_count: 1000,
         apples_per_tree: 20,
         weather_data: largeWeatherData,
      };

      mockRequest.body = simulationRequest;

      // Mock Mongoose models
      const saveMock = jest.fn().mockResolvedValue({});

      (SimulationRequestModel as unknown as jest.Mock).mockImplementation(
         () => ({
            save: saveMock,
         })
      );

      (WeatherDataModel as unknown as jest.Mock).mockImplementation(() => ({
         save: saveMock,
      }));

      // Call the function
      await simulateYield(
         mockRequest as Request,
         mockResponse as Response,
         mockNext
      );

      // Verify that the yield was calculated correctly
      expect(saveMock).toHaveBeenCalledTimes(1001); // One for SimulationRequest and one for each weather entry

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(200);
   });

   it('should handle database save error', async () => {
      const simulationRequest = {
         seasonId: 'fall2023',
         tree_count: 150,
         apples_per_tree: 12,
         weather_data: [
            { temperature: 18, rainfall_mm: 8, wind_speed_kmh: 15 },
         ],
      };
      mockRequest.body = simulationRequest;

      const saveMock = jest.fn().mockRejectedValue(new Error('Database error'));
      (SimulationRequestModel as unknown as jest.Mock).mockImplementation(
         () => ({
            save: saveMock,
         })
      );

      await simulateYield(
         mockRequest as Request,
         mockResponse as Response,
         mockNext
      );

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
   });

   it('should handle invalid input data', async () => {
      const invalidSimulationRequest = {
         seasonId: 'invalid2023',
         tree_count: -10, // Invalid negative value
         apples_per_tree: 'not a number', // Invalid string instead of number
         weather_data: [
            { temperature: 'warm', rainfall_mm: 10, wind_speed_kmh: 20 }, // Invalid temperature
         ],
      };
      mockRequest.body = invalidSimulationRequest;

      await simulateYield(
         mockRequest as Request,
         mockResponse as Response,
         mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
   });
});
