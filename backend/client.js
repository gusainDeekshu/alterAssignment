const Redis = require("ioredis");

require("dotenv").config();
// Create a Redis client using environment variables
const client = new Redis({
    host: process.env.REDIS_HOST || "localhost", // Redis server host
    port: process.env.REDIS_PORT || 6379,       // Redis server port
  });

// const client = new Redis();


module.exports=client;