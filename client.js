const Redis = require("ioredis");
require("dotenv").config();

// Create a Redis client using environment variables
let client; // Define client in the outer scope

if (process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
} else {
    client = new Redis();
}

client.on("connect", () => console.log("Connected to Redis"));
client.on("error", (err) => console.error("Redis Error:", err));

module.exports = client;
