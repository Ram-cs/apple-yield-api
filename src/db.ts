import mongoose from 'mongoose';

// const MONGODB_URI = 'mongodb://localhost:27017/apple-farm'; //when run locally without using Docker
const MONGODB_URI = 'mongodb://host.docker.internal:27017/apple-farm';

const connectDb = async () => {
   try {
      // Connect to MongoDB
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected...');
   } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1); // Exit the application if the connection fails
   }
};

export default connectDb;
