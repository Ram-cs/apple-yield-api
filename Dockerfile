# Step 1: Use Node.js as the base image
FROM node:22

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json (if applicable) to install dependencies
COPY package*.json ./

# Step 4: Install dependencies (including dev dependencies like nodemon and typescript)
RUN npm install

# Step 5: Copy all source files (including TypeScript source) into the container
COPY . .

# Step 6: Expose the port the app will run on (5001 in your case)
EXPOSE 5001

# Step 7: Add mongodb URI
ENV MONGODB_URI=mongodb://host.docker.internal:27017/apple-farm

# Step 8: Run the application in development mode using nodemon
CMD ["npm", "start"]
