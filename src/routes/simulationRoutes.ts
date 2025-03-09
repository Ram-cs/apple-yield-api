import express from 'express';
import { validateSimulationRequest } from '../middlewares/validationMiddleware';
import { errorHandler } from '../middlewares/errorHandler';
import { simulateYield } from '../controllers/simulationController';

const router = express.Router();

// Apply validation middleware before handling the request
router.post('/simulate-yield', validateSimulationRequest, simulateYield);

// Global error handler, for the resnt of the stuffs
router.use(errorHandler);

export default router;
