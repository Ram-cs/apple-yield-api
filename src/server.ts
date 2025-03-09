import express from 'express';
import bodyParser from 'body-parser';
import simulationRoutes from './routes/simulationRoutes';
import optimalPlantingRoutes from './routes/optimalPlantingRoutes'; // New route for /optimal-planting-time
import connectDb from './db';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(bodyParser.json());

// Function to start the server
const startServer = async () => {
   try {
      // Connect to the database
      await connectDb();
      console.log('Database connection established');

      // Register API routes
      app.use('/', simulationRoutes);
      app.use('/', optimalPlantingRoutes);

      // Start the server
      app.listen(PORT, () => {
         console.log(`Server running on port ${PORT}`);
      });
   } catch (error) {
      console.error('Failed to start server', error);
      process.exit(1); // Exit the process with failure
   }
};

// Only start the server if this file is run directly
if (require.main === module) {
   startServer();
}

export { app };
