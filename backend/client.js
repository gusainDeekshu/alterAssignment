const Redis = require("ioredis");

require("dotenv").config();
// Create a Redis client using environment variables
let client;
if(process.env.REDIS_URL){
let client = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
client.on("connect", () => console.log("Connected to Redis"));
client.on("error", (err) => console.error("Redis Error:", err));
}else{
   client = new Redis();
   client.on("connect", () => console.log("Connected to Redis"));
   client.on("error", (err) => console.error("Redis Error:", err));
}


module.exports=client;