const {Router}=require('express')
const {loginuser, createShortUrl } = require('../controllers/usercontroller');

const { authMiddleware } = require('../middlewares/auth');

const router=Router();


router.post("/google",loginuser);
router.post("/shorten",authMiddleware,createShortUrl)


module.exports=router;