#!/bin/sh

# Set default values for environment variables if not provided
export GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI:-"http://localhost:${PORT:-3001}/auth/google/callback"}
export GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-""}
export GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-""}
export JWT_SECRET=${JWT_SECRET:-""}
export MONGO_URI=${MONGO_URI:-""}
export REDIS_HOST=${REDIS_HOST:-""}
export REDIS_PORT=${REDIS_PORT:-""}
export PORT=${PORT:-3001}
export MAX_REQUESTS=${MAX_REQUESTS:-""}
export TIME_WINDOW=${TIME_WINDOW:-""}

# Print out the environment variables for debugging (optional)
echo "Starting Node.js server with the following environment variables:"
echo "GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI"
echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET: [HIDDEN]"
echo "JWT_SECRET: [HIDDEN]"
echo "MONGO_URI: $MONGO_URI"
echo "REDIS_HOST: $REDIS_HOST"
echo "REDIS_PORT: $REDIS_PORT"
echo "PORT: $PORT"
echo "MAX_REQUESTS: $MAX_REQUESTS"
echo "TIME_WINDOW: $TIME_WINDOW"

# Start the Node.js application
exec node server.js
