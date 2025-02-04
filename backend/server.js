const cors = require("cors");

const express = require("express");
const { connectMongodb } = require("./db");

require("dotenv").config();
const newLocal_1 = './routes/userroute';
const userrouter=require(newLocal_1)

// console.log(process.env.GOOGLE_CLIENT_ID); // Debugging
// console.log(process.env.JWT_SECRET);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//establishin db conex=ctions
connectMongodb("mongodb://127.0.0.1:27017/alterAssignment");
app.use("/auth",userrouter);
// app.use("/",(req,res)=>{
//     return res.json({
//         success: true,
//         message: "Api Working successfully",
//       });
// });
app.use("/api",userrouter);


app.listen(3001, () => console.log("Server running on port 3001"));
