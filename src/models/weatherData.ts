// models/weatherData.ts
import { Schema, model, Document } from 'mongoose';

export interface WeatherData extends Document {
   seasonId: string;
   day: number;
   temperature: number;
   rainfall_mm: number;
   wind_speed_kmh: number;
}

const WeatherDataSchema = new Schema<WeatherData>({
   seasonId: { type: String, required: true },
   day: { type: Number, required: true },
   temperature: { type: Number, required: true },
   rainfall_mm: { type: Number, required: true },
   wind_speed_kmh: { type: Number, required: true },
});

export const WeatherDataModel = model<WeatherData>(
   'WeatherData',
   WeatherDataSchema
);
