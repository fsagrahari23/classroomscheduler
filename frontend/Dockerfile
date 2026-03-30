FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy rest of the code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]