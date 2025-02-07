const cors = require("cors");

const express = require("express");
const { connectMongodb } = require("./db");

require("dotenv").config();
const newLocal_1 = './routes/userroute';
const userrouter=require(newLocal_1)
const port=process.env.PORT || 3001;
// console.log(process.env.GOOGLE_CLIENT_ID); // Debugging
// console.log(process.env.JWT_SECRET);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// console.log(process.env.MONGO_URI)
//establishin db conex=ctions
connectMongodb(process.env.MONGO_URI);
app.use("/auth",userrouter);
app.use("/check",(req,res)=>{
    return res.json({
        success: true,
        message: "Api Working successfully",
      });
});

app.use("/api",userrouter);


app.listen(port, () => console.log(`Server running on port ${port}`))
