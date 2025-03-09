// models/SimulationRequest.ts
import { Schema, model, Document } from 'mongoose';

interface WeatherData {
   day: number;
   temperature: number;
   rainfall_mm: number;
   wind_speed_kmh: number;
}

export interface SimulationRequest extends Document {
   seasonId: string;
   tree_count: number;
   apples_per_tree: number;
   season_length_days: number;
   weather_data: WeatherData[];
   total_apples_yielded: number;
}

const WeatherDataSchema = new Schema<WeatherData>({
   day: { type: Number, required: true },
   temperature: { type: Number, required: true },
   rainfall_mm: { type: Number, required: true },
   wind_speed_kmh: { type: Number, required: true },
});

const SimulationRequestSchema = new Schema<SimulationRequest>({
   tree_count: { type: Number, required: true },
   apples_per_tree: { type: Number, required: true },
   season_length_days: { type: Number, required: true },
   weather_data: { type: [WeatherDataSchema], required: true },
   total_apples_yielded: { type: Number, required: true },
});

export const SimulationRequestModel = model<SimulationRequest>(
   'SimulationRequest',
   SimulationRequestSchema
);
