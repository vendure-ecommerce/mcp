# Use Node.js LTS version
FROM node:18-alpine

# Set working directory for the MCP server
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm i

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove dev dependencies for smaller final image
RUN npm cache clean --force

# Create directory for mounted project
RUN mkdir -p /workspace

# Set the default project path to the mounted workspace
ENV PROJECT_PATH=/workspace

# Make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Use our custom entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command arguments
CMD ["--projectPath", "/workspace"]
