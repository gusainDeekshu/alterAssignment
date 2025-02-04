const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../modals/users");
const URL = require("../modals/url");
const shortid = require("shortid");
const redisClient = require("../client");

require("dotenv").config();

// Max requests allowed and duration (in seconds)
const MAX_REQUESTS = process.env.MAX_REQUESTS || 10;
const TIME_WINDOW = process.env.TIME_WINDOW || 60; // 60 seconds (1 minute)

// Function to check rate limit using Redis
const isRateLimited = async (ip) => {
  const key = `rate_limit:${ip}`; // Unique key for each IP

  // Increment the request count in Redis
  const currentCount = await redisClient.incr(key);

  if (currentCount === 1) {
    // If it's the first request, set the expiration time (time window)
    await redisClient.expire(key, TIME_WINDOW);
  }

  // If the request count exceeds the max allowed requests, return true
  return currentCount > MAX_REQUESTS;
};

const loginuser = async (req, res) => {
// console.log(process.env.JWT_SECRET);
  
  try {
    const { code } = req.body;

    // Exchange code for access token
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
      code,
    });

    const accessToken = data.access_token;

    // Fetch user details from Google
    const { data: googleUser } = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { id, name, email, picture } = googleUser;

    // Check if user exists
    let user = await User.findOne({ googleId: id });

    if (!user) {
      // Create new user if not found
      user = new User({
        googleId: id,
        name,
        email,
        picture,
        accessToken,
      });
      await user.save();
      const token = createtoken(user._id);
      res.json({ success: true, token });
    } else {
      // Update access token for existing user
      user.accessToken = accessToken;
      await user.save();
      const token = createtoken(user._id);
      res.json({ success: true, token });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "error in login user" });
  }
};
const createtoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};
const createShortUrl = async (req, res) => {
  try {

    const ip = req.user; // Use the IP address for rate limiting

    // Check rate limit
    const rateLimited = await isRateLimited(ip);
    if (rateLimited) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Try again later."
      });
    }
    console.log("Received Body:", req.body);
    const { longUrl, customAlias, topic } = req.body;

    

    // Validate input
    if (!longUrl) {
      return res.status(400).json({ success: false, message: "Long URL is required" });
    }

    // Check if customAlias already exists
    if (customAlias) {
      const existingUrl = await URL.findOne({ shortUrl: customAlias });
      if (existingUrl) {
        return res.status(400).json({ success: false, message: "Custom alias already in use" });
      }
    }

    // Generate a short URL (customAlias or random)
    const shortUrl = customAlias || shortid.generate();

    // Create and save the new short URL in the database
    const newUrl = new URL({
      originalUrl: longUrl,
      shortUrl,
      topic,
      analytics: { clicks: 0 }, // Initialize analytics
    });

    await newUrl.save();

    return res.status(201).json({
      success: true,
      message: "URL shortened successfully",
      data: { shortUrl, originalUrl: longUrl, topic },
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = { loginuser,createShortUrl };
