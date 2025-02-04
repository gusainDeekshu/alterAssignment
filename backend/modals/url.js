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
      clicks: { type: Number, default: 0 }, // Total clicks
      lastAccessed: { type: Date }, // Last time it was clicked
      referrers: { type: Map, of: Number, default: {} }, // Store referrer domains & counts
      userAgents: { type: Map, of: Number, default: {} }, // Track browser types
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


const URL= mongoose.model("Url", urlSchema);
module.exports= URL;