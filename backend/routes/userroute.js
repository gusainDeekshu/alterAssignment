const {Router}=require('express')
const {loginuser, createShortUrl, redirectShortUrl } = require('../controllers/usercontroller');

const { authMiddleware } = require('../middlewares/auth');

const router=Router();


router.post("/google",loginuser);
router.post("/shorten",authMiddleware,createShortUrl);
router.get("/shorten/:alias",redirectShortUrl);


module.exports=router;