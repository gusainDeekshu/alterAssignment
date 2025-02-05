const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../modals/users");
const URL = require("../modals/url");
const shortid = require("shortid");
const redisClient = require("../client");
const useragent = require("useragent");
const geoip = require("geoip-lite");

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
        message: "Rate limit exceeded. Try again later.",
      });
    }
    // console.log("Received Body:", req.body);
    const { longUrl, customAlias, topic } = req.body;

    // Validate input
    if (!longUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Long URL is required" });
    }

    // Check if customAlias already exists
    if (customAlias) {
      const existingUrl = await URL.findOne({ shortUrl: customAlias });
      if (existingUrl) {
        return res
          .status(400)
          .json({ success: false, message: "Custom alias already in use" });
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
    // Cache the short URL and its long URL mapping in Redis
    await redisClient.setex(`shorturl:${shortUrl}`, 3600, longUrl); // Cache for 1 hour (3600 seconds)

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

const redirectShortUrl = async (req, res) => {
  try {
    const { alias } = req.params;
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgentString = req.headers["user-agent"];

    // Parse User-Agent for OS and Device Type
    const agent = useragent.parse(userAgentString);
    const osName = agent.os.toString().split(" ")[0] || "Unknown OS";
    const deviceType = /mobile/i.test(userAgentString) ? "mobile" : "desktop";

    // Lookup geolocation
    let geo = geoip.lookup(ip);
    if (!geo) {
      geo = { country: "Unknown", city: "Unknown" };
    }
    const location = geo.country || "Unknown";

    const urlRecord = await URL.findOne({ shortUrl: alias });

    if (!urlRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Short URL not found" });
    }

    // Increment Click Count
    urlRecord.analytics.clicks += 1;
    urlRecord.analytics.lastAccessed = new Date();

    // Track OS Type
    if (!urlRecord.analytics.osType) {
      urlRecord.analytics.osType = [];
    }

    const osIndex = urlRecord.analytics.osType.findIndex(
      (os) => os.osName === osName
    );

    if (osIndex !== -1) {
      // Ensure uniqueUsers is an array
      if (!Array.isArray(urlRecord.analytics.osType[osIndex].uniqueUsers)) {
        urlRecord.analytics.osType[osIndex].uniqueUsers = [];
      }

      // Check if the IP is already counted
      if (!urlRecord.analytics.osType[osIndex].uniqueUsers.includes(ip)) {
        urlRecord.analytics.osType[osIndex].uniqueUsers.push(ip);
        urlRecord.analytics.osType[osIndex].uniqueClicks += 1; // Increment only for new users
      }
    } else {
      urlRecord.analytics.osType.push({
        osName,
        uniqueClicks: 1,
        uniqueUsers: [ip], // Use an array instead of a Set
      });
    }

    // Track Device Type
    if (!urlRecord.analytics.deviceType) {
      urlRecord.analytics.deviceType = [];
    }

    const deviceIndex = urlRecord.analytics.deviceType.findIndex(
      (device) => device.deviceName === deviceType
    );

    if (deviceIndex !== -1) {
      // Ensure uniqueUsers is an array
      if (
        !Array.isArray(urlRecord.analytics.deviceType[deviceIndex].uniqueUsers)
      ) {
        urlRecord.analytics.deviceType[deviceIndex].uniqueUsers = [];
      }

      // Check if the IP is already counted
      if (
        !urlRecord.analytics.deviceType[deviceIndex].uniqueUsers.includes(ip)
      ) {
        urlRecord.analytics.deviceType[deviceIndex].uniqueUsers.push(ip);
        urlRecord.analytics.deviceType[deviceIndex].uniqueClicks += 1;
      }
    } else {
      urlRecord.analytics.deviceType.push({
        deviceName: deviceType,
        uniqueClicks: 1,
        uniqueUsers: [ip], // Use an array instead of a Set
      });
    }

    // Track User-Agent
    const sanitizedUserAgent = userAgentString
      .replace(/\./g, "_")
      .replace(/\//g, "_");

    urlRecord.analytics.userAgents.set(
      sanitizedUserAgent,
      (urlRecord.analytics.userAgents.get(sanitizedUserAgent) || 0) + 1
    );

    // Save the Updated Record
    await urlRecord.save();

    return res.redirect(urlRecord.originalUrl);
  } catch (error) {
    console.error("Error redirecting short URL:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { loginuser, createShortUrl, redirectShortUrl };
