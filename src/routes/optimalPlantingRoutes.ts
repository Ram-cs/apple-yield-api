import express from 'express';
import { getOptimalPlantingTime } from '../controllers/optimalPlantingController';

const router = express.Router();

// Define the endpoint for optimal planting time
router.get('/optimal-planting-time', getOptimalPlantingTime);

export default router;
