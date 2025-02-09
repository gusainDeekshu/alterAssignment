const cors = require("cors");

const express = require("express");
const { connectMongodb } = require("./db");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cookieParser = require('cookie-parser');
const { redirectToGoogleAuth, logoutUser } = require("./controllers/usercontroller");

require("dotenv").config();
const newLocal_1 = './routes/userroute';
const userrouter=require(newLocal_1)
const port=process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";



const app = express();
app.use(cors({
  origin: '*', // Allow all origins (for testing, not recommended for production)
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// console.log(process.env.MONGO_URI)
//establishin db conex=ctions
connectMongodb(process.env.MONGO_URI);

app.get('/login/google',redirectToGoogleAuth);


/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logs out the user by clearing the auth token cookie
 *     description: Clears the authentication cookie and logs out the user.
 *     tags:
 *       - Logout
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 */

app.post('/auth/logout', logoutUser);


const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Short URL API",
      version: "1.0.0",
      description: `API documentation for the URL tracking application  
      <br> <span style='color: red; font-weight: bold;'>Note:</span> For token, click 
      <a href="${BASE_URL}login/google" target="_blank"><code>/login/google</code></a> or add this after URL.`,
    },
    components: {
      securitySchemes: {
        TokenAuth: {
          type: "apiKey",
          in: "header",
          name: "token", // The header key where the token is sent
          description: "Enter your authentication token here",
        },
      },
    },
    security: [{ TokenAuth: [] }], // Apply globally
  },
  apis: ["./routes/*.js","./server.js"], // Path to your API route files
};

const swaggerSpec= swaggerJsDoc(swaggerOptions)
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec));
app.use("/auth",userrouter);

/**
 * @swagger
 * /check:
 *   get:
 *     summary: Check API status
 *     description: Endpoint to verify if the API is working.
 *     tags:
 *     - Checking Server
 *     responses:
 *       200:
 *         description: API is working successfully.
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
 *                   example: "API working successfully"
 */

app.use("/check", (req, res) => {
  return res.json({
    success: true,
    message: "API working successfully",
  });
});
// app.use("/",(req,res)=>{
//     return res.json({
//         success: true,
//         message: "Api Working successfully",
//       });
// });
app.use("/api",userrouter);


app.listen(port, () => console.log(`Server running on port ${port}`))
