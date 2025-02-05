const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true }, // Full URL
    shortUrl: { type: String, required: true, unique: true }, // Shortened version
    topic: { 
      type: String, 
      enum: ["acquisition", "activation", "retention"], 
      required: true 
    }, // Categorization
    analytics: {
      clicks: { type: Number, default: 0 },
      lastAccessed: [{ type: Date }],
      userAgents: { type: Map, of: Number, default: {} },
      osType: [
        {
          osName: { type: String, required: true },
          uniqueClicks: { type: Number, default: 0 },
          uniqueUsers: { type: [String], default: [] }, // Ensure array of strings
        },
      ],
      deviceType: [
        {
          deviceName: String,
          uniqueClicks: Number,
          uniqueUsers: { type: Array, default: [] },
        },
      ],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


const URL= mongoose.model("Url", urlSchema);
module.exports= URL;