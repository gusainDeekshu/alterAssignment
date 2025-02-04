const jwt=require('jsonwebtoken');

const authMiddleware=async(req,res,next)=>{
   
    
const{token}=req.headers;
if(!token){
    return res.json({success:false,message:"Not Authorized Login Again"});
}
try {
    const token_decode= jwt.verify(token,process.env.JWT_SECRET)

    if(token_decode){
    next();
}else{
    res.json({success:false,message:"Not Authorized Login Again"})}
} catch (error) {
    // console.log(error);
    res.json({success:false,message:"Not authorized"})
}
}

module.exports={authMiddleware};