const Redis = require("ioredis");

require("dotenv").config();
// Create a Redis client using environment variables
const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

client.on("connect", () => console.log("Connected to Redis"));
client.on("error", (err) => console.error("Redis Error:", err));

// const client = new Redis();


module.exports=client;