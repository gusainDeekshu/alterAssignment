const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../modals/users");
const URL = require("../modals/url");
const shortid = require("shortid");
const redisClient = require("../client");
const useragent = require("useragent");

require("dotenv").config();

// Max requests allowed and duration (in seconds)
const MAX_REQUESTS = process.env.MAX_REQUESTS || 10;
const TIME_WINDOW = process.env.TIME_WINDOW || 60; // 60 seconds (1 minute)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
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

const redirectToGoogleAuth = (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile`;
  res.redirect(authUrl);
};


const loginuser = async (req, res) => {
  // console.log(process.env.JWT_SECRET);
  try {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ error: 'Authorization code not found' });
    }
    // Exchange code for access token
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
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
    const allowedTopics = ["acquisition", "activation", "retention"];
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
    if (!allowedTopics.includes(topic)) {
      return res.status(400).json({
        success: false,
        message: `Invalid topic. Allowed values: ${allowedTopics.join(", ")}`,
      });
    }
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
    if (!topic) {
      return res
        .status(400)
        .json({ success: false, message: "Topic is required" });
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

    // Cache the new short URL
    await redisClient.setex(`shorturl:${shortUrl}`, 3600, longUrl);

    // Invalidate analytics cache to reflect new URL
    await redisClient.del(`analytics:all`);
    if (topic) {
      await redisClient.del(`analytics:topic:${topic}`);
    }
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

    const urlRecord = await URL.findOne({ shortUrl: alias });

    if (!urlRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Short URL not found" });
    }

    // Increment Click Count
    urlRecord.analytics.clicks += 1;
    urlRecord.analytics.lastAccessed.push(new Date());

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
    await redisClient.del(`analytics:${alias}`);
    await redisClient.del(`analytics:all`);
    if (urlRecord.topic) {
      await redisClient.del(`analytics:topic:${urlRecord.topic}`);
    }
    
     // Detect if the request is from Swagger UI (check Accept header)
     if (req.headers['accept']?.includes('application/json')) {
      return res.json({ redirectUrl: urlRecord.originalUrl });
    }

    console.log(req.headers['accept'])
    console.log(req.headers['accept'])
    console.log(req.headers['accept'])
    console.log(req.headers['accept'])
    console.log(req.headers['accept'])
    return res.redirect(302, urlRecord.originalUrl);
  } catch (error) {
    console.error("Error redirecting short URL:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getanalyticsByAlias = async (req, res) => {
  const { alias } = req.params;

  try {
    // Check if data is cached in Redis
    const cachedData = await redisClient.get(`analytics:${alias}`);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Fetch analytics from database
    const analyticsData = await URL.findOne({ shortUrl: alias });
    if (!analyticsData) {
      return res
        .status(404)
        .json({ message: "No analytics found for this alias" });
    }

    // Process analytics data
    const totalClicks = analyticsData.analytics.clicks;
    const uniqueUsers = new Set(
      analyticsData.analytics.osType.flatMap((os) => os.uniqueUsers)
    ).size;

    const recentDates = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    });

    // Count occurrences of each date
    const dateCounts = analyticsData.analytics.lastAccessed.reduce(
      (acc, date) => {
        const dateStr = new Date(date).toISOString().split("T")[0]; // Convert to YYYY-MM-DD
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      },
      {}
    );

    // Map to the required output format
    const clicksByDate = recentDates.map((date) => ({
      date,
      clickCount: dateCounts[date] || 0, // Default to 0 if no clicks
    }));

    const osType = analyticsData.analytics.osType.map((os) => ({
      osName: os.osName,
      uniqueClicks: os.uniqueClicks,
      uniqueUsers: os.uniqueUsers.length,
    }));

    const deviceType = analyticsData.analytics.deviceType.map((device) => ({
      deviceName: device.deviceName,
      uniqueClicks: device.uniqueClicks,
      uniqueUsers: device.uniqueUsers.length,
    }));

    const response = {
      totalClicks,
      uniqueUsers,
      clicksByDate,
      osType,
      deviceType,
    };

    // Cache response in Redis
    await redisClient.setex(
      `analytics:${alias}`,
      3600,
      JSON.stringify(response)
    );

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getanalyticsByTopic = async (req, res) => {
  const { topic } = req.params;
  try {
    // Check if data is cached in Redis
    const cachedData = await redisClient.get(`analytics:topic:${topic}`);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Fetch all URLs under the specified topic
    const urls = await URL.find({ topic });
    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found for this topic" });
    }

    let totalClicks = 0;
    const uniqueUsersSet = new Set();

    const urlData = urls.map((url) => {
      totalClicks += url.analytics.clicks;

      url.analytics.osType.forEach((os) =>
        os.uniqueUsers.forEach((user) => uniqueUsersSet.add(user))
      );

      return {
        shortUrl: url.shortUrl,
        totalClicks: url.analytics.clicks,
        uniqueUsers: new Set(
          url.analytics.osType.flatMap((os) => os.uniqueUsers)
        ).size,
      };
    });

    const uniqueUsers = uniqueUsersSet.size;

    // Get last 7 days' dates
    const recentDates = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    });

    // Count clicks by date using lastAccessed timestamps
    const clicksByDate = recentDates.map((date) => {
      const clickCount = urls.reduce((sum, url) => {
        const dateCounts = url.analytics.lastAccessed.reduce(
          (acc, accessedDate) => {
            const formattedDate = new Date(accessedDate)
              .toISOString()
              .split("T")[0];
            acc[formattedDate] = (acc[formattedDate] || 0) + 1;
            return acc;
          },
          {}
        );

        return sum + (dateCounts[date] || 0);
      }, 0);

      return { date, clickCount };
    });

    const response = { totalClicks, uniqueUsers, clicksByDate, urls: urlData };

    // Cache response in Redis for 1 hour
    await redisClient.setex(
      `analytics:topic:${topic}`,
      3600,
      JSON.stringify(response)
    );

    return res.json(response);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ message: "internal server error" });
  }
};

const getAllAnalytics = async (req, res) => {
  try {
    // Check if data is cached in Redis
    console.log("Redis Client:", redisClient);
    if (!redisClient) {
        throw new Error("Redis client is not initialized.");
    }
    // const cachedData = await redisClient.get(`analytics:all`);

    const cachedData = await redisClient.get(`analytics:all`);
    if (cachedData) {
      console.log(cachedData);
      return res.json(JSON.parse(cachedData));
    }

    // Fetch all URLs from the database
    const urls = await URL.find();
    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found" });
    }

    let totalClicks = 0;
    let totalUniqueUsers = new Set();
    let osTypeData = {};
    let deviceTypeData = {};
    let accessDates = [];

    urls.forEach((url) => {
      totalClicks += url.analytics.clicks;
      accessDates = accessDates.concat(url.analytics.lastAccessed);

      // Process OS Type Analytics
      url.analytics.osType.forEach((os) => {
        if (!osTypeData[os.osName]) {
          osTypeData[os.osName] = { uniqueClicks: 0, uniqueUsers: new Set() };
        }
        osTypeData[os.osName].uniqueClicks += os.uniqueClicks;
        os.uniqueUsers.forEach((user) => {
          totalUniqueUsers.add(user);
          osTypeData[os.osName].uniqueUsers.add(user);
        });
      });

      // Process Device Type Analytics
      url.analytics.deviceType.forEach((device) => {
        if (!deviceTypeData[device.deviceName]) {
          deviceTypeData[device.deviceName] = {
            uniqueClicks: 0,
            uniqueUsers: new Set(),
          };
        }
        deviceTypeData[device.deviceName].uniqueClicks += device.uniqueClicks;
        device.uniqueUsers.forEach((user) => {
          deviceTypeData[device.deviceName].uniqueUsers.add(user);
        });
      });
    });

    // Compute Clicks by Date (Last 7 Days)
    const recentDates = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    });

    const clicksByDate = recentDates.map((date) => {
      const count = accessDates.filter(
        (accessDate) =>
          new Date(accessDate).toISOString().split("T")[0] === date
      ).length;
      return { date, clickCount: count };
    });

    // Convert osTypeData and deviceTypeData to arrays
    const osType = Object.entries(osTypeData).map(([osName, data]) => ({
      osName,
      uniqueClicks: data.uniqueClicks,
      uniqueUsers: data.uniqueUsers.size,
    }));

    const deviceType = Object.entries(deviceTypeData).map(
      ([deviceName, data]) => ({
        deviceName,
        uniqueClicks: data.uniqueClicks,
        uniqueUsers: data.uniqueUsers.size,
      })
    );

    // Response Object
    const response = {
      totalUrls: urls.length,
      totalClicks,
      uniqueUsers: totalUniqueUsers.size,
      clicksByDate,
      osType,
      deviceType,
    };

    // Cache the response in Redis for 1 hour (3600 seconds)
    await redisClient.setex(`analytics:all`, 3600, JSON.stringify(response));

    return res.json(response);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ message: "internal server error" });
  }
};


const logoutUser = (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: true, sameSite: 'None' });
   return res.json({ message: 'Logged out successfully' });
};

module.exports = {
  loginuser,
  createShortUrl,
  redirectShortUrl,
  getanalyticsByAlias,
  getanalyticsByTopic,
  getAllAnalytics,redirectToGoogleAuth,
  logoutUser
};
