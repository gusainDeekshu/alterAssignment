const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
  return  res.status(401).json({ success: false, message: "Token not provided." });
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    if (token_decode) {
      req.user = token_decode;
      next();
    } else {
   return   res.status(401).json({ success: false, message: "Not Authorized. Please log in again." });

    }
  } catch (error) {
    console.log(error);
  return  res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { authMiddleware };
