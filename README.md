## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Build and Run Instructions](#docker-build-and-run-instructions)
3. [Testing](#testing)
   -  [Running Tests](#running-tests)
4. [Design Rationale with Example Usage of the API](#design-rationale-with-example-usage-of-the-api)
   -  Controllers
      -  [optimalPlantingController.ts](#optimalplantingcontrollerts)
      -  [simulationController.ts](#simulationcontrollerts)
   -  Models
      -  [SimulationRequest.ts](#simulationrequestts)
      -  [weatherData.ts](#weatherdatats)
   -  Middlewares
      -  [validationMiddleware.ts](#validationmiddlewarets)
      -  [errorHandler.ts](#errorhandlerts)
   -  Routes
      -  [simulationRoutes.ts](#simulationroutests)
      -  [optimalPlantingRoutes.ts](#optimalplantingroutests)
   -  Database Connection
   -  Server
5. [Example Requests](#example-requests)
   -  POST Request: /simulate-yield
   -  GET Request: /optimal-planting-time
6. [Explanation of the New Optimal-Planting-Time Endpoint](#explanation-of-the-new-optimal-planting-time-endpoint)
7. [Analysis of Historical Data for Optimal Planting Time](#documentation-analysis-of-historical-data-for-optimal-planting-time)
8. [Steps to Install and Run MongoDB Community Edition Locally Using `mongod`](#)

### Prerequisites

-  Ensure you have **Node.js version 22 or above** installed on your system. You can check your Node.js version by running `node -v` in your terminal. If you need to install or update Node.js, visit the official Node.js website: [https://nodejs.org/](https://nodejs.org/)

## Docker Build and Run Instructions

The provided `Dockerfile` and `package.json` enable you to containerize and run the `apple-yield-api` application using Docker. Follow the instructions below to build and run the application inside a Docker container.

---

### Prerequisites

1. **Install Docker**: Ensure Docker is installed on your system. You can download it from [Docker's official website](https://www.docker.com/).
2. **MongoDB Setup**: The application connects to a MongoDB instance. Ensure MongoDB is running locally or accessible at the URI specified in the `Dockerfile`:
   ```
   mongodb://host.docker.internal:27017/apple-farm
   ```

---

### Steps to Build and Run the Docker Container

#### 1. Build the Docker Image

Use the `docker build` command to create a Docker image for the application.

```bash
docker build -t apple-yield-api .
```

-  **`-t apple-yield-api`**: Tags the image with the name `apple-yield-api`.
-  **`.`**: Specifies that the `Dockerfile` is in the current directory.

#### 2. Run the Docker Container

After building the image, run it using the `docker run` command:

```bash
docker run -p 5001:5001 -v $(pwd):/usr/src/app apple-yield-api
```

-  **`-p 5001:5001`**: Maps port `5001` on your host machine to port `5001` inside the container.
-  **`-v $(pwd):/usr/src/app`**: Mounts your current working directory into `/usr/src/app` inside the container, allowing live updates during development.
-  **`apple-yield-api`**: Specifies the name of the image to run.

---

### Using NPM Scripts for Docker Commands

You can also use predefined npm scripts in `package.json` for convenience:

1. **Build and Run in One Step (run the app)**
   Run both build and run commands together using:

   ```bash
   npm run docker
   ```

   This script executes:

   ```bash
   docker build -t apple-yield-api .
   docker run -p 5001:5001 -v $(pwd):/usr/src/app apple-yield-api
   ```

2. **Build the Image:**
   To only build the Docker image, use:

   ```bash
   npm run docker-build
   ```

3.**Run the Container:**
To only run an already built Docker image, use:

```bash
npm run docker-run
```

---

### Verifying Container Status

To verify that your container is running:

```bash
docker ps
```

This will list all running containers along with their port mappings and statuses.

---

### Accessing the Application

Once the container is running, you can access the API at:

```
http://localhost:5001/
```

For example:

-  Test the `/optimal-planting-time` endpoint:
   ```bash
   curl http://localhost:5001/optimal-planting-time
   ```

---

### Stopping and Removing Containers

To stop a running container:

```bash
docker stop
```

To remove a stopped container:

```bash
docker rm
```

You can find ``by running`docker ps -a`.

---

### Notes

1. **Development Mode**:
   The application runs in development mode using `nodemon`. Any changes made to source files will automatically restart the server inside the container.
2. **Environment Variables**:
   The MongoDB URI is set in the `Dockerfile` using:

   ```
   ENV MONGODB_URI=mongodb://host.docker.internal:27017/apple-farm
   ```

   If you need to connect to a different MongoDB instance, update this value or override it when running the container:

   ```bash
   docker run -e MONGODB_URI= -p 5001:5001 -v $(pwd):/usr/src/app apple-yield-api
   ```

3. **Production Deployment**:
   For production, consider modifying the `Dockerfile` to exclude development dependencies (e.g., nodemon) and use a production-ready command such as:
   ```bash
   CMD ["node", "dist/index.js"]
   ```

## Testing

The application includes a suite of tests to ensure the correctness and reliability of its functionalities. These tests cover various aspects of the application, including API endpoints, middleware, and data validation.

### Running Tests

To execute the tests, follow these steps:

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone
   cd apple-yield-api
   ```

2. **Install Dependencies:** Ensure that all project dependencies are installed by running the following command in the project's root directory:

   ```bash
   npm install
   ```

3. **Run Tests:** Execute the tests using the `test` script defined in `package.json`. Run this command in the project's root directory:

   ```bash
   npm run tests
   ```

   This command will run Jest with the `--detectOpenHandles` flag, which helps prevent Jest from hanging due to open handles.

## Design Rationale with example usage of the API

This application simulates apple yield based on weather conditions and provides insights into optimal planting times. The architecture is structured around a RESTful API using Express.js, Mongoose for MongoDB interaction, and Node.js for the runtime environment. The design emphasizes modularity, separation of concerns, and maintainability.

### 1. Controllers

The controllers handle incoming HTTP requests, orchestrate the application logic, and return responses to the client.

-  **`optimalPlantingController.ts`**:
   -  **`getOptimalPlantingTime`**: This function aggregates weather data to determine optimal planting times.
      -  **Rationale**: The function uses MongoDB's aggregation pipeline to group weather data by `seasonId` and calculate average temperature, rainfall, and maximum wind speed. It then filters these aggregated results to find seasons that meet the defined optimal conditions (temperature, rainfall, and wind speed within specific ranges). This approach allows for efficient data processing directly within the database. The results are then returned as a JSON response, including the optimal seasons, the total number of seasons analyzed, and the criteria used for determining optimality.
      -  Error handling is included to return a 404 status if no optimal planting times are found and a 500 status for any other errors.
-  **`simulationController.ts`**:
   -  **`simulateYield`**: This function simulates apple yield based on the provided weather data and other parameters.
      -  **Rationale:** This asynchronous function is designed to handle the simulation of apple yield based on weather conditions. It takes in a `simulationRequest` from the request body, which includes the `seasonId` and `weather_data`. The function then proceeds to calculate the `total_apples_yielded` using the `calculateYield` helper function. Following the yield calculation, it creates a new `SimulationRequest` document, saves it to the database, and also saves the weather data associated with the provided `seasonId` into the `WeatherDataModel`.
      -  By saving both the simulation request and the weather data, the application ensures a comprehensive record of each simulation for future analysis or auditing. The weather data is saved in a separate model (`WeatherDataModel`) linked to the `seasonId`, which allows for easier querying and aggregation of weather information.
      -  The use of `next(error)` in the catch block passes any errors to the next error-handling middleware, allowing for centralized error handling.

### 2. Models

Mongoose models define the structure and behavior of the data stored in MongoDB.

-  **`SimulationRequest.ts`**:
   -  Defines the schema for simulation requests, including fields for `tree_count`, `apples_per_tree`, `season_length_days`, `weather_data`, and `total_apples_yielded`.
   -  **Rationale**: This model represents a request to simulate apple yield, containing all the necessary input parameters. The `weather_data` field is an array of `WeatherDataSchema`, embedding weather information directly within the simulation request. This design choice simplifies data retrieval for a specific simulation request.
-  **`weatherData.ts`**:
   -  Defines the schema for weather data, including fields for `seasonId`, `day`, `temperature`, `rainfall_mm`, and `wind_speed_kmh`.
   -  **Rationale**: This model is used to store daily weather information for a specific season. Including `seasonId` allows for easy querying of weather data for a particular season. Separating weather data into its own model allows for reuse and independent querying of weather information.

### 3. Middlewares

Middlewares are functions that intercept requests and responses to perform tasks such as validation, authentication, and error handling.

-  **`validationMiddleware.ts`**:
   -  **`validateSimulationRequest`**: Validates the request body for the `/simulate-yield` endpoint.
      -  **Rationale**: This middleware ensures that the incoming request body contains all the required fields and that they meet the specified criteria (e.g., positive numbers for counts and lengths, non-empty weather data array). By validating the request body before processing, the application can prevent errors and ensure data integrity. A custom error object with a 400 status code is created and passed to the next middleware if validation fails.
-  **`errorHandler.ts`**:
   -  **`errorHandler`**: Centralized error handling middleware.
      -  **Rationale**: This middleware catches any errors that occur during request processing. It logs the error stack for debugging purposes and sends an appropriate JSON response with an error message and status code (defaults to 500 for internal server errors). Centralized error handling simplifies error management and provides a consistent error response format to the client.

### 4. Routes

Express.js routes define the endpoints that the application exposes.

-  **`simulationRoutes.ts`**:
   -  Defines the `/simulate-yield` endpoint, applying the `validateSimulationRequest` middleware before the `simulateYield` controller.
   -  **Rationale**: This route handles the simulation of apple yield. By applying the `validateSimulationRequest` middleware, it ensures that the request body is validated before the `simulateYield` controller is executed. The `errorHandler` middleware is also applied to handle any errors that occur during request processing.
-  **`optimalPlantingRoutes.ts`**:
   -  Defines the `/optimal-planting-time` endpoint, which is handled by the `getOptimalPlantingTime` controller.
   -  **Rationale**: This route provides the functionality to retrieve optimal planting times based on weather data. It is a simple GET endpoint that invokes the `getOptimalPlantingTime` controller to perform the necessary data aggregation and filtering.

### 5. Database Connection (`db.ts`)

This module establishes a connection to the MongoDB database using Mongoose.

-  **Rationale**: The `connectDb` function attempts to connect to the MongoDB instance specified by the `MONGODB_URI` environment variable. It uses `mongoose.connect` to establish the connection and logs a success message if the connection is successful. If an error occurs during the connection process, it logs the error and exits the application. This ensures that the application only starts if a database connection can be established. Using an environment variable for the MongoDB URI allows for easy configuration of the database connection in different environments.

### 6. Server (`server.ts`)

This module sets up the Express.js server, configures middleware, registers routes, and starts the server.

-  **Rationale**: The `server.ts` file is the entry point of the application. It initializes an Express.js application, configures middleware such as `bodyParser.json()` for parsing JSON request bodies, and registers the API routes defined in `simulationRoutes.ts` and `optimalPlantingRoutes.ts`.
-  The `startServer` function encapsulates the logic for connecting to the database and starting the server. This function is called only if the module is the main module being run, which allows for testing and importing the app without immediately starting the server.
-  Error handling is included to catch any errors that occur during server startup. If an error occurs, it logs the error and exits the application.

### Example Requests

Given that the server is running on `http://localhost:5001`, here are examples of how to make requests to the API endpoints.

#### 1. POST Request: `/simulate-yield`

This request simulates apple yield based on the provided weather data. The request body must conform to the `SimulationRequest` interface defined in the models.

**Example Request Body (JSON):**

```json
{
   "seasonId": "spring2025",
   "tree_count": 100,
   "apples_per_tree": 50,
   "season_length_days": 90,
   "weather_data": [
      {
         "day": 1,
         "temperature": 22,
         "rainfall_mm": 10,
         "wind_speed_kmh": 25
      },
      {
         "day": 2,
         "temperature": 25,
         "rainfall_mm": 8,
         "wind_speed_kmh": 15
      },
      {
         "day": 3,
         "temperature": 28,
         "rainfall_mm": 12,
         "wind_speed_kmh": 20
      }
   ]
}
```

**Example using `curl`:**

```bash
curl -X POST \
  http://localhost:5001/simulate-yield \
  -H 'Content-Type: application/json' \
  -d '{
    "seasonId": "spring2025",
    "tree_count": 100,
    "apples_per_tree": 50,
    "season_length_days": 90,
    "weather_data": [
      {
        "day": 1,
        "temperature": 22,
        "rainfall_mm": 10,
        "wind_speed_kmh": 25
      },
      {
        "day": 2,
        "temperature": 25,
        "rainfall_mm": 8,
        "wind_speed_kmh": 15
      },
      {
        "day": 3,
        "temperature": 28,
        "rainfall_mm": 12,
        "wind_speed_kmh": 20
      }
    ]
  }'
```

**Expected Response (Success - 200 OK):**

```json
{
   "total_apples_yielded": 144000 //example
}
```

**Explanation**:

-  `-X POST`: Specifies that this is a POST request.
-  `-H 'Content-Type: application/json'`: Sets the content type of the request to JSON.
-  `-d '{...}'`: Provides the request body in JSON format.

#### 2. GET Request: `/optimal-planting-time`

This request retrieves optimal planting times based on the aggregated weather data stored in the database. No request body is required.

**Example using `curl`:**

```bash
curl http://localhost:5001/optimal-planting-time
```

**Expected Response (Success - 200 OK):**

```json
{
   "optimalSeasons": [
      {
         "_id": "spring2025",
         "avgTemperature": 24,
         "avgRainfall": 10,
         "maxWindSpeed": 25
      }
   ],
   "totalSeasonsAnalyzed": 1,
   "criteria": {
      "temperatureRange": "20°C to 30°C",
      "rainfallRange": "5mm to 20mm",
      "maxWindSpeedThreshold": "<= 30 km/h"
   }
}
```

**Expected Response (No optimal planting times found - 404 Not Found):**

```json
{
   "message": "No optimal planting times found."
}
```

**Explanation**:

-  The `curl` command sends a GET request to the specified URL.
-  The server responds with a JSON object containing the optimal seasons, total seasons analyzed, and the criteria used. If no optimal seasons are found, a 404 error is returned with a message.

Explanation of the new optimal-planting-time endpoint
The /optimal-planting-time endpoint is a new feature in our API that analyzes historical weather data to determine the best times for planting apple trees. This endpoint uses aggregated weather information to identify seasons with optimal conditions for apple tree growth.

## Documentation: Analysis of Historical Data for Optimal Planting Time

The `getOptimalPlantingTime` function performs an analysis of historical weather data to determine the optimal planting times for apple trees. This analysis is crucial for maximizing crop yield by identifying seasons with the most favorable weather conditions.

### Data Source

The analysis uses historical weather data stored in the `WeatherDataModel`. This model is expected to contain records with the following fields:

-  `seasonId`: Identifier for each planting season
-  `temperature`: Daily temperature readings
-  `rainfall_mm`: Daily rainfall measurements in millimeters
-  `wind_speed_kmh`: Daily wind speed measurements in kilometers per hour

### Analysis Process

1. **Data Aggregation**:
   The function uses MongoDB's aggregation pipeline to process the weather data:

   ```javascript
   WeatherDataModel.aggregate([
      {
         $group: {
            _id: '$seasonId',
            avgTemperature: { $avg: '$temperature' },
            avgRainfall: { $avg: '$rainfall_mm' },
            maxWindSpeed: { $max: '$wind_speed_kmh' },
         },
      },
      // ... (matching and sorting stages)
   ]);
   ```

   This stage groups the data by `seasonId` and calculates:

   -  Average temperature for each season
   -  Average rainfall for each season
   -  Maximum wind speed recorded in each season

2. **Filtering Optimal Conditions**:
   The aggregation pipeline then filters the seasons based on predefined optimal conditions:

   ```javascript
   {
     $match: {
       avgTemperature: { $gte: 20, $lte: 30 },
       avgRainfall: { $gte: 5, $lte: 20 },
       maxWindSpeed: { $lte: 30 },
     },
   }
   ```

   The optimal conditions are:

   -  Average temperature between 20°C and 30°C
   -  Average rainfall between 5mm and 20mm per day
   -  Maximum wind speed not exceeding 30 km/h

3. **Sorting Results**:
   The results are sorted by average temperature in ascending order:

   ```javascript
   {
      $sort: {
         avgTemperature: 1;
      }
   }
   ```

   This sorting helps identify the coolest seasons among those meeting the optimal criteria.

### Output

The analysis results are returned as a JSON object containing:

-  `optimalSeasons`: An array of seasons meeting the optimal criteria, including their average temperature, rainfall, and maximum wind speed.
-  `totalSeasonsAnalyzed`: The number of seasons that met the optimal criteria.
-  `criteria`: A description of the optimal conditions used for filtering.

### Error Handling

-  If no seasons meet the optimal criteria, a 404 status code is returned with a message indicating no optimal planting times were found.
-  Any errors during the aggregation process result in a 500 status code with an error message.

### Usage Considerations

-  This analysis assumes that the optimal conditions for apple tree planting are consistent across different varieties and locations. Adjustments to the filtering criteria may be necessary for specific apple varieties or regional climate variations.
-  The analysis provides a seasonal overview and does not account for short-term weather fluctuations within a season.
-  Regular updates to the historical weather data will improve the accuracy and relevance of the analysis over time.

### Steps to Install and Run MongoDB Community Edition Locally Using `mongod`

Follow these steps to install and run MongoDB Community Edition locally on your system using the `mongod` command.

---

### **For Windows**

#### 1. Download the MongoDB Installer

-  Visit the [MongoDB Community Edition Download Page](https://www.mongodb.com/try/download/community).
-  Select your version, platform (`Windows`), and package (`MSI`).
-  Click **Download**.

#### 2. Install MongoDB

-  Run the downloaded `.msi` installer.
-  Follow the installation wizard:
   -  Choose **Complete** for a default installation.
   -  Optionally, install **MongoDB Compass** (a GUI for MongoDB).
-  After installation, MongoDB binaries will be located in:
   ```
   C:\Program Files\MongoDB\Server\\bin
   ```

#### 3. Create a Data Directory

MongoDB requires a directory to store its data. By default, it uses `C:\data\db`.

-  Open Command Prompt and run:
   ```bash
   mkdir C:\data\db
   ```

#### 4. Start MongoDB Server

-  Open Command Prompt and navigate to the MongoDB `bin` directory:
   ```bash
   cd "C:\Program Files\MongoDB\Server\\bin"
   ```
-  Start the server using `mongod`:
   ```bash
   mongod --dbpath C:\data\db
   ```
-  The server will start, and you will see logs indicating that MongoDB is listening on port `27017`.

---

### **For Linux**

#### 1. Add MongoDB Repository

-  Import the public key:
   ```bash
   curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
   ```
-  Add the repository:
   ```bash
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   ```

#### 2. Install MongoDB

-  Update packages and install MongoDB:
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

#### 3. Create a Data Directory (if not default)

By default, MongoDB stores data in `/data/db`. If this directory does not exist, create it:

```bash
sudo mkdir -p /data/db
sudo chown -R `id -u` /data/db
```

#### 4. Start MongoDB Server

Start the server using:

```bash
mongod --dbpath /data/db
```

The server will start and listen on port `27017`.

---

### **For macOS**

#### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

#### 2. Install MongoDB via Homebrew

```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
```

#### 3. Create a Data Directory (if not default)

By default, MongoDB stores data in `/data/db`. If this directory does not exist, create it:

```bash
sudo mkdir -p /data/db
sudo chown -R `id -u` /data/db
```

#### 4. Start MongoDB Server

Start the server using:

```bash
mongod --dbpath /data/db
```

The server will start and listen on port `27017`.

---

### Verifying Installation

1. Open another terminal or command prompt.
2. Use the following command to connect to the running MongoDB instance:
   ```bash
   mongosh
   ```
   This will open the MongoDB shell connected to `localhost:27017`.

---

### Notes

1. **Default Port**: MongoDB listens on port `27017` by default.
2. **Configuration File**: You can use a configuration file (`mongod.cfg`) to specify options like `dbpath`, ports, etc.
3. **Running as a Service**: For production environments, consider running MongoDB as a service for automatic startup.
