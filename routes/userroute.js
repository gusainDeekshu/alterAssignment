const {Router}=require('express')
const {loginuser, createShortUrl, redirectShortUrl, getanalyticsByAlias, getanalyticsByTopic, getAllAnalytics } = require('../controllers/usercontroller');

const { authMiddleware } = require('../middlewares/auth');

const router=Router();

router.get("/google/callback",loginuser);

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create a Short URL
 *     description: Generates a short URL for a given long URL with optional custom alias and topic.
 *     tags:
 *       - Url Shortner
 *     security:
 *       - TokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - longUrl
 *               - topic
 *             properties:
 *               longUrl:
 *                 type: string
 *                 description: The original long URL to be shortened.
 *                 example: "https://www.example.com"
 *               customAlias:
 *                 type: string
 *                 description: (Optional) Custom alias for the short URL.
 *                 example: "myCustomAlias"
 *               topic:
 *                 type: string
 *                 enum: ["acquisition", "activation", "retention"]
 *                 description: Topic/category for analytics.
 *                 example: "acquisition"
 *     responses:
 *       201:
 *         description: Short URL created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "URL shortened successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shortUrl:
 *                       type: string
 *                       example: "abc123"
 *                     originalUrl:
 *                       type: string
 *                       example: "https://www.example.com"
 *                     topic:
 *                       type: string
 *                       example: "marketing"
 *       400:
 *         description: Bad request - validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Long URL is required"
 *       429:
 *         description: Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Rate limit exceeded. Try again later."
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

router.post("/shorten",authMiddleware,createShortUrl);


/**
 * @swagger
 * /api/shorten/{alias}:
 *   get:
 *     summary: Redirect a short URL to its original URL
 *     description: |
 *       This endpoint takes a short URL alias and redirects the user to the original URL.
 *       **Note:** Swagger UI does not follow redirects. Instead, it will return the redirect URL in JSON format.
 *       To test redirection, copy the URL from the response and open it in a browser.
 *     tags:
 *       - Redirect Short url 
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias of the shortened URL.
 *     responses:
 *       302:
 *         description: Redirects to the original URL.
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: The URL to which the client is redirected.
 *       200:
 *         description: Returns the redirect URL for API clients (e.g., Swagger UI)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirectUrl:
 *                   type: string
 *                   example: "https://example.com"
 *       404:
 *         description: Short URL not found.
 *       500:
 *         description: Internal server error.
 */


router.get("/shorten/:alias",redirectShortUrl);

/**
 * @swagger
 * /api/analytics/overall:
 *   get:
 *     summary: Get overall analytics for all shortened URLs
 *     description: |
 *       Fetches analytics data for all shortened URLs, including total clicks, unique users, 
 *       OS and device type distribution, and click trends over the last 7 days.
 *       The response is cached in Redis for 1 hour.
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUrls:
 *                   type: integer
 *                   example: 10
 *                   description: Total number of shortened URLs
 *                 totalClicks:
 *                   type: integer
 *                   example: 1500
 *                   description: Total number of clicks across all URLs
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 500
 *                   description: Number of unique users who accessed the shortened URLs
 *                 clicksByDate:
 *                   type: array
 *                   description: Click activity over the past 7 days
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2025-02-01"
 *                       clickCount:
 *                         type: integer
 *                         example: 250
 *                 osType:
 *                   type: array
 *                   description: Analytics data categorized by operating system
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                         example: "Windows"
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 700
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 300
 *                 deviceType:
 *                   type: array
 *                   description: Analytics data categorized by device type
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                         example: "Mobile"
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 900
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 400
 *       404:
 *         description: No URLs found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No URLs found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

router.get("/analytics/overall",authMiddleware,getAllAnalytics);
/**
 * @swagger
 * /api/analytics/{alias}:
 *   get:
 *     summary: Get analytics data for a specific short URL alias
 *     description: |
 *       Fetches analytics data for a specific short URL alias, including total clicks, 
 *       unique users, OS and device type distribution, and click trends over the last 7 days.
 *       The response is cached in Redis for 1 hour.
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The alias of the shortened URL.
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                   example: 500
 *                   description: Total number of clicks for this short URL
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 200
 *                   description: Number of unique users who accessed this short URL
 *                 clicksByDate:
 *                   type: array
 *                   description: Click activity over the past 7 days
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2025-02-01"
 *                       clickCount:
 *                         type: integer
 *                         example: 50
 *                 osType:
 *                   type: array
 *                   description: Analytics data categorized by operating system
 *                   items:
 *                     type: object
 *                     properties:
 *                       osName:
 *                         type: string
 *                         example: "Windows"
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 300
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 150
 *                 deviceType:
 *                   type: array
 *                   description: Analytics data categorized by device type
 *                   items:
 *                     type: object
 *                     properties:
 *                       deviceName:
 *                         type: string
 *                         example: "Mobile"
 *                       uniqueClicks:
 *                         type: integer
 *                         example: 400
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 180
 *       404:
 *         description: No analytics found for this alias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No analytics found for this alias"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server Error"
 */

router.get("/analytics/:alias",authMiddleware,getanalyticsByAlias);

/**
 * @swagger
 * /api/analytics/topic/{topic}:
 *   get:
 *     summary: Get analytics data for a specific topic
 *     description: Retrieves analytics data based on a selected topic.
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["acquisition", "activation", "retention"]
 *         description: Select a topic from the allowed values.
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data for the specified topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks:
 *                   type: integer
 *                   example: 1200
 *                   description: Total number of clicks across all URLs in this topic
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 450
 *                   description: Number of unique users who accessed the shortened URLs under this topic
 *                 clicksByDate:
 *                   type: array
 *                   description: Click activity over the past 7 days
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2025-02-01"
 *                       clickCount:
 *                         type: integer
 *                         example: 150
 *                 urls:
 *                   type: array
 *                   description: List of URLs with their analytics data
 *                   items:
 *                     type: object
 *                     properties:
 *                       shortUrl:
 *                         type: string
 *                         example: "short.ly/abc123"
 *                         description: The shortened URL alias
 *                       totalClicks:
 *                         type: integer
 *                         example: 300
 *                         description: Total number of clicks for this URL
 *                       uniqueUsers:
 *                         type: integer
 *                         example: 120
 *                         description: Number of unique users who accessed this URL

 *       404:
 *         description: Topic not found
 *       500:
 *         description: Internal server error
 */
router.get("/analytics/topic/:topic",authMiddleware,getanalyticsByTopic);

module.exports=router;